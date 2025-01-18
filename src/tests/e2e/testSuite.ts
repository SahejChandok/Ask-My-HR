import { runPayrollTests } from './payrollTests';
import { runEmployeeTests } from './employeeTests';
import { runTimesheetTests } from './timesheetTests';
import { runLeaveTests } from './leaveTests';
import { TestResult, TestSuite } from '../types';
import { formatTestResults } from '../utils/testFormatter';

export async function runTestSuite(): Promise<TestSuite> {
  console.log('Starting end-to-end test suite...\n');
  const startTime = performance.now();
  
  const suites: TestSuite = {
    employee: { results: [], startTime: 0, endTime: 0 },
    timesheet: { results: [], startTime: 0, endTime: 0 },
    leave: { results: [], startTime: 0, endTime: 0 },
    payroll: { results: [], startTime: 0, endTime: 0 }
  };

  try {
    // Run employee tests first
    suites.employee.startTime = performance.now();
    suites.employee.results = await runEmployeeTests();
    suites.employee.endTime = performance.now();

    // Only continue if employee tests pass
    if (suites.employee.results.every(r => r.passed)) {
      // Run timesheet tests
      suites.timesheet.startTime = performance.now();
      suites.timesheet.results = await runTimesheetTests();
      suites.timesheet.endTime = performance.now();

      // Run leave tests
      suites.leave.startTime = performance.now();
      suites.leave.results = await runLeaveTests();
      suites.leave.endTime = performance.now();

      // Run payroll tests last
      suites.payroll.startTime = performance.now();
      suites.payroll.results = await runPayrollTests();
      suites.payroll.endTime = performance.now();
    }

    // Format and display results
    const endTime = performance.now();
    formatTestResults(suites, startTime, endTime);

    return suites;
  } catch (error) {
    console.error('Test suite failed:', error);
    throw error;
  }
}