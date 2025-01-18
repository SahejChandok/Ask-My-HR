import { supabase } from '../lib/supabase';
import { config } from '../config/environment';

export async function testSupabaseConnection() {
  try {
    // First validate environment
    if (!config.supabase.url || !config.supabase.anonKey) {
      return {
        connected: false,
        error: 'Missing Supabase configuration'
      };
    }

    // Test basic query
    const { error } = await supabase.from('tenants').select('id').limit(1);
    
    if (error) {
      return {
        connected: false,
        error: error.message
      };
    }

    return {
      connected: true
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}