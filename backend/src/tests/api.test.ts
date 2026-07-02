// Integration tests — run against a REAL PostgreSQL database.
// Requires DATABASE_URL and JWT_SECRET (see backend/.env.example);
// `docker compose up -d db` at the repo root provides a suitable database.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const { app, server, io } = await import('../server.js');
const { client } = await import('../db/index.js');

// Unique suffix per run so tests never collide with existing rows
const run = `t${Date.now().toString(36)}`;
const username = `arena_test_${run}`;
const password = 'Test-Password-1';

let token: string;
let teamId: number;

describe('health', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /ready confirms database connectivity', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});

describe('auth', () => {
  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username,
      email: `${username}@example.com`,
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username,
      email: `${username}@example.com`,
      password,
      displayName: 'Arena Test',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe(username);
    token = res.body.token;
  });

  it('logs in with the same credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username, password: 'Wrong-Password-1' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns the user with a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(username);
  });

  it('GET /api/auth/me rejects a missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('teams authorization', () => {
  it('rejects unauthenticated team creation', async () => {
    const res = await request(app).post('/api/teams').send({ name: `NoAuth ${run}` });
    expect(res.status).toBe(401);
  });

  it('creates a team for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Test Team ${run}`, description: 'integration test team' });
    expect(res.status).toBe(201);
    expect(res.body.team.owner).toBe(`@${username}`);
    expect(res.body.team.rating).toBe(1200);
    teamId = res.body.team.id;
  });

  it("rejects another user's attempt to modify the team", async () => {
    const intruder = `intruder_${run}`;
    const reg = await request(app).post('/api/auth/register').send({
      username: intruder,
      email: `${intruder}@example.com`,
      password,
    });
    expect(reg.status).toBe(201);

    const res = await request(app)
      .put(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ description: 'hijacked' });
    expect(res.status).toBe(403);
  });

  it('lets the owner update the team', async () => {
    const res = await request(app)
      .put(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'updated by owner' });
    expect(res.status).toBe(200);
    expect(res.body.team.description).toBe('updated by owner');
  });
});

describe('matches & leaderboard authorization', () => {
  it('rejects unauthenticated match creation', async () => {
    const res = await request(app).post('/api/matches').send({ topic: 'unauthorized match' });
    expect(res.status).toBe(401);
  });

  it('rejects non-admin leaderboard ranking updates', async () => {
    const res = await request(app)
      .post('/api/leaderboard/update-rankings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('serves the public leaderboard', async () => {
    const res = await request(app).get('/api/leaderboard/top');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topTeams)).toBe(true);
    // A team was created earlier in this suite, so the list is never empty
    const first = res.body.topTeams[0];
    expect(typeof first.rank).toBe('number'); // regression: pg row_number() returns strings
    expect(first.rank).toBe(1);
    expect(first.badge).toBe('crown');
  });

  it('serves live matches', async () => {
    const res = await request(app).get('/api/matches/live');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matches)).toBe(true);
  });
});

afterAll(async () => {
  io.close();
  server.close();
  await client.end({ timeout: 5 });
});
