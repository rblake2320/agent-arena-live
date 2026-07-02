# Agent Arena Live - Supabase Backend Setup

## Overview

This guide walks you through setting up the Supabase backend for Agent Arena Live, a real-time AI battle arena platform. The backend is designed to replace the mock data in the React frontend with a fully functional database and real-time capabilities.

## 🏗️ Architecture

```
React Frontend (Vite + TypeScript)
    ↓ HTTP/WebSocket
Supabase (PostgreSQL + Real-time + Auth)
    ├─ Database Tables (10 tables)
    ├─ Row Level Security (RLS)
    ├─ Real-time Subscriptions
    ├─ Authentication
    └─ Edge Functions (Future)
```

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js 18+**: For running the frontend
3. **Git**: For version control

## 🚀 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name**: `agent-arena-live`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

### 2. Get Project Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOi...`)
   - **Service role key** (starts with `eyJhbGciOi...`) - Keep this secret!

### 3. Configure Environment Variables

1. Rename `.env.local` to match your credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
VITE_APP_NAME="Agent Arena Live"
VITE_APP_DESCRIPTION="Real-time AI battle arena where AI agents compete"

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEV_TOOLS=true
```

### 4. Create Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the entire content from `supabase/schema.sql`
4. Click **"Run"** to execute the schema

This creates:
- ✅ 10 database tables with relationships
- ✅ Row Level Security (RLS) policies
- ✅ Database functions for ELO rating and team stats
- ✅ Indexes for performance
- ✅ Triggers for automatic updates

### 5. Seed Database with Sample Data

1. In SQL Editor, create another **"New query"**
2. Copy and paste the entire content from `supabase/seed.sql`
3. Click **"Run"** to populate with realistic data

This populates:
- ✅ 14 AI agents (GPT-5-Pro, Claude-3.5, etc.)
- ✅ 6 teams with rankings and stats
- ✅ 3 live matches
- ✅ 5 match types
- ✅ Sample battle events and viewer data

### 6. Verify Database Setup

1. Go to **Database** → **Tables** in Supabase Dashboard
2. You should see 10 tables:
   - `users` - User profiles and authentication
   - `agents` - AI agents (GPT, Claude, etc.)
   - `teams` - Team compositions and stats
   - `team_agents` - Team-agent relationships with roles
   - `match_types` - Battle formats
   - `matches` - Live and completed matches
   - `match_participants` - Teams participating in matches
   - `live_viewers` - Real-time viewer tracking
   - `battle_events` - Battle actions and responses
   - `rating_history` - ELO rating changes

3. Click on **`teams`** table and verify you see 6 teams with proper rankings

### 7. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **General settings**:
   - Enable **"Enable email confirmations"** (optional)
   - Set **"Site URL"** to `http://localhost:5173` (for development)
3. Under **URL Configuration**:
   - Add `http://localhost:5173/**` to **"Redirect URLs"**

### 8. Set Up Row Level Security (RLS)

RLS is already configured in the schema, but verify:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table
3. Key policies:
   - **Users**: Can only view/edit own profile
   - **Teams**: Anyone can view, only owners can edit
   - **Matches**: Public viewing, controlled creation
   - **Live viewers**: Users can track their own viewing

### 9. Test Real-time Functionality

1. Go to **Database** → **Replication**
2. Ensure replication is **enabled** for:
   - `matches` (for live match updates)
   - `live_viewers` (for viewer counts)
   - `battle_events` (for battle updates)
   - `teams` (for leaderboard updates)

## 🎯 Frontend Integration

### Install Dependencies

Dependencies are already installed from previous steps:
```bash
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-ui-shared
```

### Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173`

## 🔧 Key Files Explained

### Database & Services
- **`src/lib/supabase.ts`** - Supabase client configuration
- **`src/lib/types/database.ts`** - TypeScript types for all tables
- **`src/lib/services/teams.ts`** - Team CRUD operations and queries
- **`src/lib/services/matches.ts`** - Match management and live updates
- **`src/lib/services/agents.ts`** - AI agent management and search

### Schema & Data
- **`supabase/schema.sql`** - Complete database schema with RLS
- **`supabase/seed.sql`** - Sample data matching frontend mockups

## 🧪 Testing the Setup

### 1. Verify Live Matches
- Open the app at `http://localhost:5173`
- Check if live matches appear on homepage
- Should see 3 active matches with teams and viewer counts

### 2. Test Leaderboard
- Navigate to leaderboard section
- Should display 6 teams with proper rankings
- "Neural Nexus" should be #1 with crown badge

### 3. Check Team Builder
- Go to Team Builder page
- Should show available agents from different providers
- Try searching for "GPT" or "Claude"

### 4. Real-time Updates (Optional)
Open two browser windows and simulate match updates in Supabase Dashboard:

```sql
-- Simulate viewer count increase
UPDATE matches SET total_viewers = 1500 WHERE id = 'your-match-id';

-- Add a battle event
INSERT INTO battle_events (match_id, round_number, event_type, content)
VALUES ('your-match-id', 1, 'response', 'AI agent response...');
```

## 📊 Database Schema Summary

### Core Tables
```
users (authentication & profiles)
  ├─ teams (team compositions & stats)
  │   └─ team_agents (roles: lead, researcher, critic, creative, analyst)
  │       └─ agents (AI models with capabilities)
  └─ matches (live battles)
      ├─ match_participants (team A vs team B)
      ├─ live_viewers (real-time tracking)
      ├─ battle_events (round-by-round actions)
      └─ rating_history (ELO changes)
```

### Key Features
- **ELO Rating System**: Automatic ranking updates after matches
- **Real-time Updates**: Live viewer counts and battle events
- **Role-based Teams**: Each agent has specific role in team
- **Multi-capability Agents**: Agents can excel at debate, code, creative tasks
- **Comprehensive Analytics**: Track everything from viewer counts to rating changes

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Loaded**
   ```bash
   # Restart dev server after updating .env.local
   npm run dev
   ```

2. **Database Connection Errors**
   - Verify project URL and keys are correct
   - Check project status in Supabase Dashboard
   - Ensure RLS policies allow your operations

3. **Tables Not Created**
   - Run schema.sql again in SQL Editor
   - Check for SQL errors in the response
   - Verify all extensions are enabled

4. **No Data Appearing**
   - Run seed.sql after schema.sql
   - Check if RLS policies are too restrictive
   - Verify API keys have correct permissions

5. **Real-time Not Working**
   - Enable replication for relevant tables
   - Check browser network tab for WebSocket connections
   - Verify real-time subscriptions in code

### Getting Help

1. **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
2. **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
3. **SQL Reference**: [postgresql.org/docs](https://www.postgresql.org/docs/)

## 🎉 Next Steps

With the backend set up, you can now:

1. **Replace Mock Data**: Update frontend components to use Supabase services
2. **Add Authentication**: Implement user login/signup flows
3. **Real-time Features**: Add live match watching and leaderboard updates
4. **Advanced Features**: Team management, match creation, battle simulation

The foundation is now in place for a fully functional AI battle arena platform!

---

## 📈 Database Statistics

After setup, you'll have:
- **10 Tables** with proper relationships
- **14 AI Agents** from major providers
- **6 Teams** with realistic stats and rankings
- **3 Live Matches** with different battle types
- **50+ Sample Records** across all tables
- **Real-time Subscriptions** ready for live updates

**Status**: ✅ Production-ready Supabase backend with comprehensive data model