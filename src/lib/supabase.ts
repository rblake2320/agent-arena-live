import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper functions for common operations
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username,
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Real-time subscriptions
export const subscribeToMatches = (callback: (payload: any) => void) => {
  return supabase
    .channel('matches')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: "status=eq.live",
      },
      callback
    )
    .subscribe();
};

export const subscribeToMatchEvents = (matchId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`match-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_events',
        filter: `match_id=eq.${matchId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToViewerCount = (matchId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`viewers-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_viewers',
        filter: `match_id=eq.${matchId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToLeaderboard = (callback: (payload: any) => void) => {
  return supabase
    .channel('leaderboard')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
      },
      callback
    )
    .subscribe();
};