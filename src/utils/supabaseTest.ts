import { supabase } from '../lib/supabase';

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}