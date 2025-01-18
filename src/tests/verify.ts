import { validateEnvironment } from '../utils/environmentValidation';
import { testSupabaseConnection } from '../utils/supabaseConnection';

async function verifySetup() {
  console.log('Verifying setup...');

  // Check environment variables
  const envValidation = validateEnvironment();
  if (!envValidation.valid) {
    console.error('❌ Environment validation failed:');
    envValidation.errors.forEach(error => console.error(`  - ${error}`));
    return;
  }
  console.log('✅ Environment variables validated');

  // Test Supabase connection
  const connectionTest = await testSupabaseConnection();
  if (!connectionTest.connected) {
    console.error(`❌ Supabase connection failed: ${connectionTest.error}`);
    return;
  }
  console.log('✅ Supabase connection successful');

  console.log('\nSetup verification complete! 🎉');
}

// Only run in development
if (import.meta.env.DEV) {
  verifySetup().catch(console.error);
}