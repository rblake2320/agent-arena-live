// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          name: string
          provider: string
          model_id: string
          capabilities: string[]
          description: string | null
          max_tokens: number | null
          cost_per_1k_tokens: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          provider: string
          model_id: string
          capabilities?: string[]
          description?: string | null
          max_tokens?: number | null
          cost_per_1k_tokens?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          model_id?: string
          capabilities?: string[]
          description?: string | null
          max_tokens?: number | null
          cost_per_1k_tokens?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
          description: string | null
          logo_url: string | null
          rating: number | null
          wins: number | null
          losses: number | null
          draws: number | null
          current_streak: number | null
          longest_streak: number | null
          streak_type: string | null
          total_matches: number | null
          rank: number | null
          badge: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          description?: string | null
          logo_url?: string | null
          rating?: number | null
          wins?: number | null
          losses?: number | null
          draws?: number | null
          current_streak?: number | null
          longest_streak?: number | null
          streak_type?: string | null
          total_matches?: number | null
          rank?: number | null
          badge?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          description?: string | null
          logo_url?: string | null
          rating?: number | null
          wins?: number | null
          losses?: number | null
          draws?: number | null
          current_streak?: number | null
          longest_streak?: number | null
          streak_type?: string | null
          total_matches?: number | null
          rank?: number | null
          badge?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      team_agents: {
        Row: {
          id: string
          team_id: string
          agent_id: string
          role: string
          position: number
          added_at: string
        }
        Insert: {
          id?: string
          team_id: string
          agent_id: string
          role?: string
          position?: number
          added_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          agent_id?: string
          role?: string
          position?: number
          added_at?: string
        }
      }
      match_types: {
        Row: {
          id: string
          name: string
          description: string | null
          max_rounds: number | null
          time_limit_seconds: number | null
          scoring_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          max_rounds?: number | null
          time_limit_seconds?: number | null
          scoring_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          max_rounds?: number | null
          time_limit_seconds?: number | null
          scoring_type?: string | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          match_type_id: string
          topic: string
          status: string
          current_round: number | null
          max_rounds: number | null
          winner_team_id: string | null
          total_viewers: number | null
          peak_viewers: number | null
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_type_id: string
          topic: string
          status?: string
          current_round?: number | null
          max_rounds?: number | null
          winner_team_id?: string | null
          total_viewers?: number | null
          peak_viewers?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_type_id?: string
          topic?: string
          status?: string
          current_round?: number | null
          max_rounds?: number | null
          winner_team_id?: string | null
          total_viewers?: number | null
          peak_viewers?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      match_participants: {
        Row: {
          id: string
          match_id: string
          team_id: string
          team_side: string
          final_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          team_id: string
          team_side: string
          final_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          team_id?: string
          team_side?: string
          final_score?: number | null
          created_at?: string
        }
      }
      live_viewers: {
        Row: {
          id: string
          match_id: string
          session_id: string
          user_id: string | null
          joined_at: string
          left_at: string | null
          is_active: boolean | null
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          match_id: string
          session_id: string
          user_id?: string | null
          joined_at?: string
          left_at?: string | null
          is_active?: boolean | null
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          session_id?: string
          user_id?: string | null
          joined_at?: string
          left_at?: string | null
          is_active?: boolean | null
          user_agent?: string | null
          ip_address?: string | null
        }
      }
      battle_events: {
        Row: {
          id: string
          match_id: string
          round_number: number
          event_type: string
          team_id: string | null
          agent_id: string | null
          content: string | null
          metadata: Json | null
          score: number | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          round_number: number
          event_type: string
          team_id?: string | null
          agent_id?: string | null
          content?: string | null
          metadata?: Json | null
          score?: number | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          round_number?: number
          event_type?: string
          team_id?: string | null
          agent_id?: string | null
          content?: string | null
          metadata?: Json | null
          score?: number | null
          timestamp?: string
          created_at?: string
        }
      }
      rating_history: {
        Row: {
          id: string
          team_id: string
          match_id: string | null
          old_rating: number
          new_rating: number
          rating_change: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          match_id?: string | null
          old_rating: number
          new_rating: number
          rating_change: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          match_id?: string | null
          old_rating?: number
          new_rating?: number
          rating_change?: number
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_team_stats: {
        Args: {
          p_team_id: string
          p_match_result: string
          p_new_rating: number
        }
        Returns: undefined
      }
      calculate_elo_rating: {
        Args: {
          winner_rating: number
          loser_rating: number
          k_factor?: number
        }
        Returns: {
          new_winner_rating: number
          new_loser_rating: number
        }[]
      }
      update_team_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamAgent = Database['public']['Tables']['team_agents']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchType = Database['public']['Tables']['match_types']['Row']
export type MatchParticipant = Database['public']['Tables']['match_participants']['Row']
export type LiveViewer = Database['public']['Tables']['live_viewers']['Row']
export type BattleEvent = Database['public']['Tables']['battle_events']['Row']
export type RatingHistory = Database['public']['Tables']['rating_history']['Row']

// Composite types for frontend components
export interface TeamWithAgents extends Team {
  agents?: (Agent & { role: string; position: number })[]
  owner?: User
}

export interface MatchWithDetails extends Match {
  match_type?: MatchType
  participants?: (MatchParticipant & { team?: TeamWithAgents })[]
  events?: BattleEvent[]
  viewers_count?: number
}

export interface LiveMatchData {
  id: string
  teamA: {
    name: string
    agents: string[]
  }
  teamB: {
    name: string
    agents: string[]
  }
  type: string
  topic: string
  viewers: number
  round: number
  maxRounds: number
  status: string
}

export interface LeaderboardTeam {
  rank: number
  name: string
  owner: string
  rating: number
  wins: number
  losses: number
  streak: string
  change: string
  badge: string | null
}