import { supabase } from './supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_DELAY = 5000;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if the Supabase connection is working with retry logic
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      // Try a simple query to verify connection
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!error) {
        return true;
      }

      console.warn(`Connection attempt ${attempt + 1} failed:`, error);
    } catch (err) {
      console.warn(`Connection attempt ${attempt + 1} failed:`, err);
    }

    attempt++;
    if (attempt < MAX_RETRIES) {
      // Exponential backoff with jitter
      const delay = Math.min(
        RETRY_DELAY * Math.pow(2, attempt) * (0.5 + Math.random()),
        MAX_DELAY
      );
      await wait(delay);
    }
  }

  return false;
}