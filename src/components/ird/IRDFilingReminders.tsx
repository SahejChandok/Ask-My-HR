import React from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface IRDFilingRemindersProps {
  nextDueDate: Date | null;
  filingFrequency: string;
  enableReminders: boolean;
  onToggleReminders: (enabled: boolean) => void;
}

export function IRDFilingReminders({
  nextDueDate,
  filingFrequency,
  enableReminders,
  onToggleReminders
}: IRDFilingRemindersProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">Filing Reminders</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Next Filing Due
              </span>
            </div>
            {nextDueDate && (
              <span className="text-sm text-gray-900">
                {formatDisplayDate(nextDueDate)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {filingFrequency === 'payday' 
              ? 'Due within 2 working days of each payday'
              : filingFrequency === 'twice-monthly'
              ? 'Due on the 15th and last day of each month'
              : 'Due by the 20th of each month'}
          </p>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={enableReminders}
              onChange={(e) => onToggleReminders(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable email reminders
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Receive email notifications before filings are due
          </p>
        </div>

        {enableReminders && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-900">
                Reminder Schedule
              </span>
            </div>
            <ul className="mt-2 text-sm text-gray-500 space-y-1">
              <li>5 days before due date</li>
              <li>1 day before due date</li>
              <li>On the due date</li>
              <li>When a filing becomes overdue</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}