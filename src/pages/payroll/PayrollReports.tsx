import React, { useState } from 'react';
import { FileText, Users, DollarSign } from 'lucide-react';
import { PayrollReportFilters } from '../../components/payroll/reports/PayrollReportFilters';

export function PayrollReports() {
  const [selectedReport, setSelectedReport] = useState<string>();

  const reports = [
    {
      id: 'pay-summary',
      title: 'Pay Summary',
      description: 'View and export detailed pay summaries by period',
      icon: FileText,
      href: '#pay-summary'
    },
    {
      id: 'employee-earnings',
      title: 'Employee Earnings',
      description: 'Annual and YTD earnings reports by employee',
      icon: Users,
      href: '#employee-earnings'
    },
    {
      id: 'deductions',
      title: 'Deductions Report',
      description: 'PAYE, KiwiSaver and ACC levy summaries',
      icon: DollarSign,
      href: '#deductions'
    }
  ];

  function handleDateRangeChange(start: string, end: string) {
    console.log('Date range changed:', { start, end });
  }

  function handleEmployeeChange(employeeId: string) {
    console.log('Employee changed:', employeeId);
  }

  function handleDepartmentChange(departmentId: string) {
    console.log('Department changed:', departmentId);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      <PayrollReportFilters
        onDateRangeChange={handleDateRangeChange}
        onEmployeeChange={handleEmployeeChange}
        onDepartmentChange={handleDepartmentChange}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <report.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {report.title}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {report.description}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a
                  href={report.href}
                  className="font-medium text-indigo-700 hover:text-indigo-900"
                >
                  View report
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport && (
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {reports.find(r => r.id === selectedReport)?.title}
            </h2>
            {/* Report specific content would be rendered here */}
          </div>
        </div>
      )}
    </div>
  );
}