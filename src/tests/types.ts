export interface TestResult {
  step: string;
  passed: boolean;
  error?: string;
  data?: any;
}

export interface TestSuiteResult {
  results: TestResult[];
  startTime: number;
  endTime: number;
}

export interface TestSuite {
  employee: TestSuiteResult;
  timesheet: TestSuiteResult;
  leave: TestSuiteResult;
  payroll: TestSuiteResult;
}

export interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  suiteResults: {
    [key: string]: {
      passed: number;
      failed: number;
      duration: number;
    };
  };
}