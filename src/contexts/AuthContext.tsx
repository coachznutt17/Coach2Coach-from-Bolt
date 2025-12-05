import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { initializeSampleData } from '../lib/localStorage';
import { initializeMessagingData } from '../lib/messaging';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: { first_name: string; last_name: string; title?: string; location?: string }
  ) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const transformSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: supabaseUser.user_metadata?.first_name || '',
    lastName: supabaseUser.user_metadata?.last_name || '',
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSampleData();
    initializeMessagingData();

    const initializeAuth = async () => {
      try {
        console.log('[Auth Init] Checking for existing session...');

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Init] Session error:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('[Auth Init] Session found for:', session.user.email);
          setUser(transformSupabaseUser(session.user));
        } else {
          console.log('[Auth Init] No active session');
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth Init] Error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth State Change]', _event, session?.user?.email);
      if (session?.user) {
        setUser(transformSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('[Supabase Signup] Creating user...', { email, userData });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            title: userData.title || '',
            location: userData.location || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('[Signup Error]', error);
        return { data: null, error };
      }

      if (data.user) {
        console.log('[Signup Success] User created:', data.user.id);
        setUser(transformSupabaseUser(data.user));
      }

      return { data, error: null };
    } catch (e: any) {
      console.error('[Signup Error]', e);
      return { data: null, error: { message: e.message || 'Signup failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Supabase Signin] Authenticating...', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Signin Error]', error);
        return { data: null, error };
      }

      if (data.user) {
        console.log('[Signin Success] User authenticated:', data.user.email);
        setUser(transformSupabaseUser(data.user));
      }

      return { data, error: null };
    } catch (e: any) {
      console.error('[Signin Error]', e);
      return { data: null, error: { message: e.message || 'Login failed' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('[Supabase Signout] Signing out...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Signout Error]', error);
        return { error };
      }

      setUser(null);
      console.log('[Signout Success] User signed out');

      return { error: null };
    } catch (e: any) {
      console.error('[Signout Error]', e);
      return { error: { message: e.message || 'Failed to sign out' } };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
