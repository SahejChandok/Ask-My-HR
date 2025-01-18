import { config } from '../config/environment';
import { supabase } from '../lib/supabase';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateSetup(): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate environment variables
  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Test Supabase connection if env vars are present
  if (config.supabase.url && config.supabase.anonKey) {
    try {
      const { error } = await supabase.from('tenants').select('id').limit(1);
      if (error) {
        errors.push(`Supabase connection failed: ${error.message}`);
      }
    } catch (error) {
      errors.push(`Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}