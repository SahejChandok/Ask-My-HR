import { supabase } from '../lib/supabase';
import { config } from '../config/environment';

export async function testSupabaseSetup() {
  const tests = [
    {
      name: 'Environment Variables',
      run: () => {
        if (!config.supabase.url || !config.supabase.anonKey) {
          throw new Error('Missing Supabase configuration');
        }
        return true;
      }
    },
    {
      name: 'Database Connection',
      run: async () => {
        const { error } = await supabase.from('tenants').select('id').limit(1);
        if (error) throw error;
        return true;
      }
    },
    {
      name: 'Authentication',
      run: async () => {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        return true;
      }
    }
  ];

  const results = [];
  for (const test of tests) {
    try {
      await test.run();
      results.push({ name: test.name, passed: true });
    } catch (error) {
      results.push({ 
        name: test.name, 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return results;
}