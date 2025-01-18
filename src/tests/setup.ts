import { validateSetup } from '../utils/validation';

async function runSetupTests() {
  console.log('Running setup tests...');

  const validation = await validateSetup();
  
  if (validation.valid) {
    console.log('✅ All validation checks passed');
  } else {
    console.error('❌ Validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
}

// Only run in development
if (import.meta.env.DEV) {
  runSetupTests().catch(console.error);
}