import React from 'react';
import { EmployeeProfile } from '../../types';
import { UserCog } from 'lucide-react';

interface EmployeeListProps {
  employees: EmployeeProfile[];
  onEdit: (employee: EmployeeProfile) => void;
}

export function EmployeeList({ employees, onEdit }: EmployeeListProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              IRD Number
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pay Rate
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              KiwiSaver
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tax Code
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {employee.first_name} {employee.last_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                {employee.ird_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  employee.employment_type === 'salary' 
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {employee.employment_type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                {employee.employment_type === 'salary' 
                  ? `$${(employee.hourly_rate * 2080).toFixed(2)}/yr`
                  : `$${employee.hourly_rate.toFixed(2)}/hr`
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {employee.kiwisaver_enrolled ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {employee.kiwisaver_rate}%
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    Not Enrolled
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                {employee.tax_code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  employee.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => onEdit(employee)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <UserCog className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}