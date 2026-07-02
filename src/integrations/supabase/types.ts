export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          api_endpoint: string | null
          avatar_url: string | null
          capabilities: string[] | null
          created_at: string
          description: string | null
          elo_rating: number | null
          id: string
          is_public: boolean | null
          matches_played: number | null
          name: string
          owner_id: string
          provider: string
          updated_at: string
          wins: number | null
        }
        Insert: {
          api_endpoint?: string | null
          avatar_url?: string | null
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          elo_rating?: number | null
          id?: string
          is_public?: boolean | null
          matches_played?: number | null
          name: string
          owner_id: string
          provider: string
          updated_at?: string
          wins?: number | null
        }
        Update: {
          api_endpoint?: string | null
          avatar_url?: string | null
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          elo_rating?: number | null
          id?: string
          is_public?: boolean | null
          matches_played?: number | null
          name?: string
          owner_id?: string
          provider?: string
          updated_at?: string
          wins?: number | null
        }
        Relationships: []
      }
      match_messages: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          match_id: string
          message_type: string | null
          metadata: Json | null
          round: number
          team_id: string | null
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          id?: string
          match_id: string
          message_type?: string | null
          metadata?: Json | null
          round: number
          team_id?: string | null
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          message_type?: string | null
          metadata?: Json | null
          round?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_votes: {
        Row: {
          created_at: string
          id: string
          match_id: string
          round: number | null
          score: number | null
          team_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          round?: number | null
          score?: number | null
          team_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          round?: number | null
          score?: number | null
          team_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_votes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          challenger_score: number | null
          challenger_team_id: string | null
          created_at: string
          current_round: number | null
          defender_score: number | null
          defender_team_id: string | null
          ended_at: string | null
          id: string
          match_type: string
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          topic: string | null
          total_rounds: number | null
          updated_at: string
          viewer_count: number | null
          winner_team_id: string | null
        }
        Insert: {
          challenger_score?: number | null
          challenger_team_id?: string | null
          created_at?: string
          current_round?: number | null
          defender_score?: number | null
          defender_team_id?: string | null
          ended_at?: string | null
          id?: string
          match_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          topic?: string | null
          total_rounds?: number | null
          updated_at?: string
          viewer_count?: number | null
          winner_team_id?: string | null
        }
        Update: {
          challenger_score?: number | null
          challenger_team_id?: string | null
          created_at?: string
          current_round?: number | null
          defender_score?: number | null
          defender_team_id?: string | null
          ended_at?: string | null
          id?: string
          match_type?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          topic?: string | null
          total_rounds?: number | null
          updated_at?: string
          viewer_count?: number | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_defender_team_id_fkey"
            columns: ["defender_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          position: number
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          position?: number
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          position?: number
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          elo_rating: number | null
          id: string
          is_public: boolean | null
          matches_played: number | null
          name: string
          owner_id: string
          updated_at: string
          wins: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          elo_rating?: number | null
          id?: string
          is_public?: boolean | null
          matches_played?: number | null
          name: string
          owner_id: string
          updated_at?: string
          wins?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          elo_rating?: number | null
          id?: string
          is_public?: boolean | null
          matches_played?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
          wins?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      match_status: "pending" | "in_progress" | "completed" | "cancelled"
      team_role: "lead" | "researcher" | "critic" | "creative" | "analyst"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      match_status: ["pending", "in_progress", "completed", "cancelled"],
      team_role: ["lead", "researcher", "critic", "creative", "analyst"],
    },
  },
} as const
