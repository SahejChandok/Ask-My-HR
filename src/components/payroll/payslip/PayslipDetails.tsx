import React from 'react';
import { PayrollResultData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { MINIMUM_WAGE } from '../../../utils/tax/constants';

interface PayslipDetailsProps {
  employee: PayrollResultData['employee'];
  calculations: PayrollResultData['calculations'];
}

export function PayslipDetails({ employee, calculations }: PayslipDetailsProps) {
  const annualSalary = employee.employment_type === 'salary' 
    ? employee.hourly_rate * 2080 
    : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Details</h4>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="text-sm text-gray-500">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tax Code</p>
            <p className="text-sm font-medium text-gray-900">{employee.tax_code}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Employment Details</h4>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Employment Type</p>
            <p className="text-sm font-medium text-gray-900">
              {employee.employment_type === 'salary' ? 'Salaried' : 'Hourly'} Employee
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pay Rate</p>
            <p className="text-sm font-medium text-gray-900">
              {employee.employment_type === 'salary' ? (
                <>
                  {formatCurrency(annualSalary!)} per year
                  <span className="block text-xs text-gray-500">
                    ({formatCurrency(employee.hourly_rate)}/hr equivalent)
                  </span>
                </>
              ) : (
                `${formatCurrency(employee.hourly_rate)}/hr`
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">KiwiSaver Status</p>
            {employee.kiwisaver_enrolled ? (
              <p className="text-sm font-medium text-gray-900">
                Enrolled ({employee.kiwisaver_rate}% contribution)
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-500">Not enrolled</p>
            )}
          </div>
        </div>
      </div>

      {calculations.minimumWageCheck && !calculations.minimumWageCheck.compliant && (
        <div className="col-span-2 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">
            Warning: Pay rate is below the minimum wage requirement of {formatCurrency(MINIMUM_WAGE.ADULT)}/hr
          </p>
        </div>
      )}
    </div>
  );
}