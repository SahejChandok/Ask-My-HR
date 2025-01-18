import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { signInWithEmail } from '../lib/auth';
import { isDevelopment } from '../utils/environment';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDevMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode] = useState(isDevelopment());

  // Development mode override for email verification
  const isEffectivelyVerified = (user: any) => {
    return isDevelopment() || user.email_confirmed_at !== null;
  };

  useEffect(() => {
    // Initialize auth state
    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          const effectivelyVerified = isEffectivelyVerified(session.user);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: session.user.user_metadata.role,
            tenant_id: session.user.user_metadata.tenant_id,
            is_verified: effectivelyVerified
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isDevelopment()) {
        console.log('Auth state change:', event);
      }
      
      if (session) {
        const effectivelyVerified = isEffectivelyVerified(session.user);

        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata.role,
          tenant_id: session.user.user_metadata.tenant_id,
          is_verified: effectivelyVerified
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await signInWithEmail(email, password);
      
      // Set user state after successful login
      if (data.user) {
        const isVerified = data.user.email_confirmed_at !== null;
        const effectivelyVerified = isDevelopment() || isVerified;
        const role = data.user.user_metadata?.role || 'employee';
        const tenantId = data.user.user_metadata?.tenant_id;

        if (!role || !tenantId) {
          throw new Error('Invalid user configuration. Please contact support.');
        }

        setUser({
          id: data.user.id,
          email: data.user.email!,
          role,
          tenant_id: tenantId,
          is_verified: effectivelyVerified
        });
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDevMode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}