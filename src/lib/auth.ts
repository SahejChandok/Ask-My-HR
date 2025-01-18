import { AuthError, AuthApiError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { checkSupabaseConnection } from './supabaseConnection';
import { isDevelopment } from '../utils/environment';

export async function signInWithEmail(email: string, password: string) {
  try {
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      throw new Error('Service temporarily unavailable. Please try again in a few moments.');
    }

    // Clear any existing session
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Clear any stale session data
    } catch (error) {
      // Ignore signout errors, proceed with signin
      console.warn('Error during signout:', error);
    }

    // Small delay to ensure session is cleared
    await new Promise(resolve => setTimeout(resolve, 100));

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error instanceof AuthApiError) {
        if (error.status === 400) {
          throw new Error('Invalid email or password. Please try the demo accounts shown below.');
        }
        if (error.status === 500) {
          throw new Error('Service temporarily unavailable. Please try again in a few moments.');
        }
        if (error.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again in a few moments.');
        }
      }
      throw error;
    }
    
    if (!data?.user?.id) {
      throw new Error('Unable to sign in. Please try again.');
    }
    
    // In development mode, auto-confirm email
    if (isDevelopment() && !data.user.email_confirmed_at) {
      await supabase.auth.updateUser({
        data: { email_confirmed: true }
      });
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}