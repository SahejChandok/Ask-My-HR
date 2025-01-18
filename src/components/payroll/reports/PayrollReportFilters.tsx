import React from 'react';
import { Calendar, Users } from 'lucide-react';

interface PayrollReportFiltersProps {
  onDateRangeChange: (start: string, end: string) => void;
  onEmployeeChange: (employeeId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
}

export function PayrollReportFilters({
  onDateRangeChange,
  onEmployeeChange,
  onDepartmentChange
}: PayrollReportFiltersProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="date"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onChange={(e) => onDateRangeChange(e.target.value, '')}
            />
            <span>to</span>
            <input
              type="date"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onChange={(e) => onDateRangeChange('', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Employee</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => onEmployeeChange(e.target.value)}
          >
            <option value="">All Employees</option>
            {/* Add employee options */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            {/* Add department options */}
          </select>
        </div>
      </div>
    </div>
  );
}