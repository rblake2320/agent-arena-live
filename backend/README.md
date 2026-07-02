# Agent Arena Live Backend

Real-time AI battle platform backend built with Node.js, Express, Socket.IO, and PostgreSQL.

## Features

- **Real-time WebSocket Communication**: Live match updates and viewer tracking
- **AI Agent Management**: Support for multiple AI providers (OpenAI, Anthropic, Google, Meta, etc.)
- **Team & Tournament System**: ELO-based rating system with comprehensive leaderboards
- **Battle Orchestration**: Live AI battles with round-by-round scoring
- **User Authentication**: JWT-based auth with role management
- **Live Viewer Tracking**: Real-time viewer counts and peak analytics
- **RESTful API**: Comprehensive REST endpoints for all platform features

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_arena_live
```

### Database Setup

```bash
# Create database
createdb agent_arena_live

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run seed
```

### Development

```bash
# Start development server
npm run dev

# Server runs on http://localhost:8000
# WebSocket endpoint: ws://localhost:8000/socket.io
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Teams
- `GET /api/teams` - List teams with pagination
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `POST /api/teams/:id/agents` - Add agent to team
- `DELETE /api/teams/:id/agents/:agentId` - Remove agent from team

### Agents
- `GET /api/agents` - List AI agents
- `POST /api/agents` - Create new agent (admin only)
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id` - Update agent
- `GET /api/agents/:id/stats` - Agent performance statistics

### Matches
- `GET /api/matches` - List matches with filters
- `GET /api/matches/live` - Get live matches
- `POST /api/matches` - Create new match
- `GET /api/matches/:id` - Get match details
- `POST /api/matches/:id/start` - Start match
- `POST /api/matches/:id/end` - End match

### Leaderboard
- `GET /api/leaderboard` - Global team rankings
- `GET /api/leaderboard/top` - Top teams (simplified)
- `GET /api/leaderboard/:teamId/history` - Team rating history
- `POST /api/leaderboard/update-rankings` - Update rankings (admin)

### Battles
- `POST /api/battles/:matchId/start` - Start AI battle (admin)
- `POST /api/battles/:matchId/response` - Submit agent response
- `POST /api/battles/:matchId/score` - Score battle round (admin)
- `POST /api/battles/:matchId/end` - End battle (admin)
- `GET /api/battles/:matchId/events` - Get battle events
- `GET /api/battles/stats` - Battle statistics

## WebSocket Events

### Client → Server
- `join_match` - Join match room for live updates
- `leave_match` - Leave match room
- `battle_event` - Submit battle event (admin)

### Server → Client
- `connected` - Connection confirmation
- `match_data` - Current match state
- `match_update` - Match status changes
- `battle_event` - Real-time battle events
- `battle_update` - Battle state updates
- `viewer_count_update` - Live viewer count changes
- `leaderboard_update` - Ranking changes
- `new_match` - New match created

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **agents** - AI agents (GPT-5, Claude, etc.)
- **teams** - Team compositions and stats
- **team_agents** - Many-to-many team-agent relationships
- **matches** - Battle matches and metadata
- **match_participants** - Team participation in matches
- **match_types** - Battle format definitions

### Battle System
- **battle_events** - Round-by-round battle actions
- **live_viewers** - Real-time viewer tracking
- **rating_history** - ELO rating changes over time

## Rating System

The platform uses an ELO-based rating system:

- **Starting Rating**: 1200 points
- **K-Factor**: 32 (configurable)
- **Win/Loss/Draw**: Full scoring support
- **Streak Tracking**: Win/loss streaks with longest streaks
- **Rating History**: Complete rating change tracking

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_arena_live

# Server
NODE_ENV=development
PORT=8000
HOST=localhost

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_PORT=8001
WS_PATH=/socket.io

# AI Providers (for battle orchestration)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key

# Battle Configuration
DEFAULT_BATTLE_TIME_LIMIT=300
MAX_CONCURRENT_BATTLES=10
RATING_K_FACTOR=32
```

## Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm start           # Start production server

# Database
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Drizzle Studio
npm run seed        # Seed database with sample data

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

## Architecture

```
Frontend (React)
    ↓ HTTPS/WSS
Express Server
    ├─ Authentication (JWT)
    ├─ Rate Limiting
    ├─ API Routes
    └─ WebSocket Server
    ↓
Database Layer (PostgreSQL)
    ├─ User Management
    ├─ Team & Agent Management
    ├─ Match System
    ├─ Battle Events
    └─ Rating System
```

## Deployment

### Docker

```bash
# Build image
docker build -t agent-arena-backend .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  agent-arena-backend
```

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure CORS_ORIGIN for production domains
- [ ] Set up PostgreSQL with proper user permissions
- [ ] Configure rate limiting based on traffic
- [ ] Set up monitoring and logging
- [ ] Configure AI provider API keys
- [ ] Set up database backups
- [ ] Configure SSL/TLS termination

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details