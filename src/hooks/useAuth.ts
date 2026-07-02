import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            // User just signed in
            break;
          case 'SIGNED_OUT':
            // User just signed out
            break;
          case 'TOKEN_REFRESHED':
            // Session was refreshed
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
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

    if (error) {
      throw error;
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updates,
    });

    if (authError) {
      throw authError;
    }

    // Update user profile in database
    const { error: dbError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', state.user.id);

    if (dbError) {
      throw dbError;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
  };
};