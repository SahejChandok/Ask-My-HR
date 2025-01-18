import { runTestSuite } from './testSuite';

async function runTests() {
  try {
    await runTestSuite();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Only run in development
if (import.meta.env.DEV) {
  runTests();
}