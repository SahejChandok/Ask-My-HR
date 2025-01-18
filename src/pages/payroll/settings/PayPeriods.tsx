import React from 'react';
import { Calendar } from 'lucide-react';

export function PayPeriods() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Pay Periods</h2>
      
      <div className="space-y-6">
        {/* Period Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pay Period Type
          </label>
          <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Pay Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pay Day
          </label>
          <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            {/* Dynamically populate based on period type */}
          </select>
        </div>
      </div>
    </div>
  );
}