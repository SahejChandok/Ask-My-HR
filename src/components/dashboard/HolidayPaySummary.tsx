import React from 'react';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { PUBLIC_HOLIDAYS } from '../../utils/holidayRules';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

export function HolidayPaySummary() {
  // Get upcoming holidays (next 3)
  const today = new Date();
  const upcomingHolidays = PUBLIC_HOLIDAYS
    .filter(holiday => new Date(holiday.date) >= today)
    .slice(0, 3);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h3 className="ml-2 text-lg font-medium text-gray-900">
            Upcoming Public Holidays
          </h3>
        </div>

        <div className="mt-4 space-y-4">
          {upcomingHolidays.map(holiday => (
            <div 
              key={holiday.date}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{holiday.name}</p>
                <p className="text-sm text-gray-500">{formatDisplayDate(holiday.date)}</p>
              </div>
              <div className="text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>1.5x pay rate</span>
                </div>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>Plus day in lieu</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900">Holiday Pay Rules</h4>
          <ul className="mt-2 text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="h-5 flex items-center mr-2">•</span>
              Time and a half for working on public holidays
            </li>
            <li className="flex items-start">
              <span className="h-5 flex items-center mr-2">•</span>
              Alternative holiday (day in lieu) when working on a public holiday
            </li>
            <li className="flex items-start">
              <span className="h-5 flex items-center mr-2">•</span>
              Regular pay for public holidays if you don't work
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}