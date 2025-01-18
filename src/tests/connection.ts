import { testSupabaseSetup } from './supabase.test';

async function runConnectionTest() {
  console.log('Testing Supabase connection...');
  const results = await testSupabaseSetup();
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.passed ? '✅' : '❌'}`);
    if (!result.passed) {
      console.error(`Error: ${result.error}`);
    }
  });
}

// Only run in development
if (import.meta.env.DEV) {
  runConnectionTest().catch(console.error);
}