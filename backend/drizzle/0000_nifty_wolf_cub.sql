CREATE TABLE IF NOT EXISTS "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"version" varchar(50),
	"capabilities" jsonb,
	"max_tokens" integer,
	"cost_per_token" numeric(10, 8),
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agents_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "battle_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"round" integer NOT NULL,
	"agent_id" integer,
	"team_id" integer,
	"event_type" varchar(50) NOT NULL,
	"content" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "live_viewers" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"user_id" integer,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"side" varchar(10) NOT NULL,
	"score" numeric(10, 2) DEFAULT '0',
	"is_winner" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"time_limit" integer,
	"max_rounds" integer DEFAULT 1 NOT NULL,
	"scoring_criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "match_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"match_type_id" integer,
	"topic" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"max_rounds" integer DEFAULT 1 NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"winner_id" integer,
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "matches_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rating_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"old_rating" integer NOT NULL,
	"new_rating" integer NOT NULL,
	"rating_change" integer NOT NULL,
	"reason" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"agent_id" integer NOT NULL,
	"role" varchar(50) DEFAULT 'member',
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"owner" varchar(100) NOT NULL,
	"owner_id" integer,
	"description" text,
	"logo" text,
	"rating" integer DEFAULT 1200 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_win_streak" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid(),
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"avatar" text,
	"is_verified" boolean DEFAULT false,
	"role" varchar(20) DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agents_name_idx" ON "agents" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_provider_idx" ON "agents" ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "battle_events_match_round_idx" ON "battle_events" ("match_id","round");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "battle_events_match_idx" ON "battle_events" ("match_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "battle_events_timestamp_idx" ON "battle_events" ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "live_viewers_match_session_idx" ON "live_viewers" ("match_id","session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "live_viewers_match_idx" ON "live_viewers" ("match_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "live_viewers_user_idx" ON "live_viewers" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "match_participants_match_team_idx" ON "match_participants" ("match_id","team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_participants_match_idx" ON "match_participants" ("match_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_participants_team_idx" ON "match_participants" ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_status_idx" ON "matches" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_start_time_idx" ON "matches" ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_type_idx" ON "matches" ("match_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rating_history_team_idx" ON "rating_history" ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rating_history_match_idx" ON "rating_history" ("match_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rating_history_created_at_idx" ON "rating_history" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_agents_team_agent_idx" ON "team_agents" ("team_id","agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_agents_team_idx" ON "team_agents" ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_agents_agent_idx" ON "team_agents" ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_idx" ON "teams" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_rating_idx" ON "teams" ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_rank_idx" ON "teams" ("rank");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_owner_idx" ON "teams" ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battle_events" ADD CONSTRAINT "battle_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battle_events" ADD CONSTRAINT "battle_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battle_events" ADD CONSTRAINT "battle_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_match_type_id_match_types_id_fk" FOREIGN KEY ("match_type_id") REFERENCES "match_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_agents" ADD CONSTRAINT "team_agents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_agents" ADD CONSTRAINT "team_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
