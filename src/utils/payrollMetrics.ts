export interface PayrollMetrics {
  timesheetLoadTime: number;
  employeeLoadTime: number;
  calculationTime: number;
  saveTime: number;
  totalTime: number;
  employeeCount: number;
  timesheetCount: number;
  batchCount: number;
  averageBatchTime: number;
  averageEmployeeTime: number;
}

export function measurePayrollPerformance(
  startTime: number,
  metrics: Partial<PayrollMetrics>
): PayrollMetrics {
  const endTime = performance.now();
  const totalTime = endTime - startTime;

  return {
    timesheetLoadTime: metrics.timesheetLoadTime || 0,
    employeeLoadTime: metrics.employeeLoadTime || 0,
    calculationTime: metrics.calculationTime || 0,
    saveTime: metrics.saveTime || 0,
    totalTime,
    employeeCount: metrics.employeeCount || 0,
    timesheetCount: metrics.timesheetCount || 0,
    batchCount: metrics.batchCount || 0,
    averageBatchTime: metrics.saveTime 
      ? metrics.saveTime / (metrics.batchCount || 1) 
      : 0,
    averageEmployeeTime: metrics.employeeCount 
      ? totalTime / metrics.employeeCount 
      : 0
  };
}

export function logPerformanceMetrics(metrics: PayrollMetrics): void {
  console.log('\nPayroll Performance Metrics:');
  console.log('---------------------------');
  console.log(`Total Time: ${(metrics.totalTime / 1000).toFixed(2)}s`);
  console.log(`Employees Processed: ${metrics.employeeCount}`);
  console.log(`Timesheets Processed: ${metrics.timesheetCount}`);
  console.log('\nBreakdown:');
  console.log(`- Timesheet Load: ${(metrics.timesheetLoadTime / 1000).toFixed(2)}s`);
  console.log(`- Employee Load: ${(metrics.employeeLoadTime / 1000).toFixed(2)}s`);
  console.log(`- Calculations: ${(metrics.calculationTime / 1000).toFixed(2)}s`);
  console.log(`- Save Operations: ${(metrics.saveTime / 1000).toFixed(2)}s`);
  console.log('\nAverages:');
  console.log(`- Per Employee: ${(metrics.averageEmployeeTime / 1000).toFixed(2)}s`);
  console.log(`- Per Batch: ${(metrics.averageBatchTime / 1000).toFixed(2)}s`);
}