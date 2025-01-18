import React from 'react';
import { LeaveBalance } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Clock } from 'lucide-react';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const percentageTaken = (balance.taken_hours / balance.accrued_hours) * 100;
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-sm text-gray-500 mb-2">
          {balance.employee_profiles?.first_name} {balance.employee_profiles?.last_name}
        </div>
        <dt className="text-sm font-medium text-gray-500">
          {balance.leave_type.charAt(0).toUpperCase() + balance.leave_type.slice(1)} Leave
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {balance.balance_hours}h
        </dd>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {percentageTaken.toFixed(1)}% Used
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-100">
              <div
                style={{ width: `${percentageTaken}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Annual Accrual:</span>
              <span className="text-gray-900 font-medium">{balance.accrued_hours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taken This Year:</span>
              <span className="text-gray-900 font-medium">{balance.taken_hours}h</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="text-gray-600">Current Balance:</span>
              <span className="text-gray-900 font-medium">{balance.balance_hours}h</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Period: {formatDisplayDate(balance.year_start)} - {formatDisplayDate(balance.year_end)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}