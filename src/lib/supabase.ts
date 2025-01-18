import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';
import { isDevelopment } from '../utils/environment';

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const MAX_DELAY = 5000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Configure Supabase client with retries and error handling
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    skipEmailVerification: isDevelopment(),
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web/2.39.7',
      'X-Development-Mode': isDevelopment() ? 'true' : 'false',
      'X-Client-Version': '2.39.7'
    },
    fetch: async (url: string, options: RequestInit) => {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const response = await fetch(url, options);
          if (response.ok) return response;
          
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Unauthorized - Please sign in again');
          }
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable');
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
          attempt++;
          if (attempt === MAX_RETRIES) throw error;
          
          // Exponential backoff with jitter
          const delay = Math.min(
            RETRY_DELAY * Math.pow(2, attempt) * (0.5 + Math.random()),
            MAX_DELAY
          );
          await wait(delay);
        }
      }
      throw new Error('Failed to fetch after retries');
    }
  }
};

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  supabaseConfig
);

/**
 * Checks if the Supabase connection is working
 * @returns Promise<boolean> True if connected, false otherwise
 */
export async function checkSupabaseConnection(
  retries = MAX_RETRIES
): Promise<boolean> {
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}