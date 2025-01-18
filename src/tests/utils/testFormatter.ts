import { TestSuite, TestMetrics } from '../types';

export function formatTestResults(
  suites: TestSuite,
  startTime: number,
  endTime: number
): void {
  const metrics = calculateMetrics(suites, startTime, endTime);
  
  // Print suite results
  Object.entries(suites).forEach(([suiteName, suite]) => {
    console.log(`\n${formatSuiteName(suiteName)} Results:`);
    
    suite.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${status} - ${result.step}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.data) {
        console.log('   Data:', result.data);
      }
    });

    const suiteMetrics = metrics.suiteResults[suiteName];
    console.log(`\n${formatSuiteName(suiteName)} Summary:`);
    console.log(`Passed: ${suiteMetrics.passed}`);
    console.log(`Failed: ${suiteMetrics.failed}`);
    console.log(`Duration: ${(suiteMetrics.duration / 1000).toFixed(2)}s`);
  });

  // Print overall summary
  console.log('\nOverall Test Summary:');
  console.log(`Total Tests: ${metrics.totalTests}`);
  console.log(`Passed: ${metrics.passedTests}`);
  console.log(`Failed: ${metrics.failedTests}`);
  console.log(`Total Duration: ${(metrics.duration / 1000).toFixed(2)}s`);
  
  const success = metrics.failedTests === 0;
  console.log(`\nOverall Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
}

function calculateMetrics(
  suites: TestSuite,
  startTime: number,
  endTime: number
): TestMetrics {
  const metrics: TestMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    duration: endTime - startTime,
    suiteResults: {}
  };

  Object.entries(suites).forEach(([suiteName, suite]) => {
    const passed = suite.results.filter(r => r.passed).length;
    const failed = suite.results.filter(r => !r.passed).length;
    
    metrics.suiteResults[suiteName] = {
      passed,
      failed,
      duration: suite.endTime - suite.startTime
    };

    metrics.totalTests += suite.results.length;
    metrics.passedTests += passed;
    metrics.failedTests += failed;
  });

  return metrics;
}

function formatSuiteName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}