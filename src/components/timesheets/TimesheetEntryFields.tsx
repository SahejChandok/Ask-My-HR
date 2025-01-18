import React from 'react';
import { Clock } from 'lucide-react';
import { PublicHolidayBadge } from '../leave/PublicHolidayBadge';
import { TimesheetEntryData } from '../../types/timesheet';
import { isPublicHoliday, HOLIDAY_PAY_RATES } from '../../utils/holidayRules';
import { calculateHoursWorked } from '../../utils/timesheetCalculations';

interface TimesheetEntryFieldsProps {
  entry: TimesheetEntryData;
  errors?: Record<string, string>;
  onChange: (field: keyof TimesheetEntryData, value: string) => void;
}

export function TimesheetEntryFields({ entry, errors = {}, onChange }: TimesheetEntryFieldsProps) {
  const hours = calculateHoursWorked({
    start_time: entry.start_time,
    end_time: entry.end_time,
    break_minutes: parseInt(entry.break_minutes)
  });
  
  const isHoliday = isPublicHoliday(entry.date);
  const holidayRate = isHoliday ? HOLIDAY_PAY_RATES.PUBLIC_HOLIDAY_RATE : 1;

  return (
    <>
      <div className="col-span-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          {isHoliday && <PublicHolidayBadge date={entry.date} />}
        </div>
        <input
          type="date"
          value={entry.date}
          onChange={(e) => onChange('date', e.target.value)}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.date ? 'border-red-300' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Start Time
        </label>
        <input
          type="time"
          value={entry.start_time}
          onChange={(e) => onChange('start_time', e.target.value)}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.start_time ? 'border-red-300' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.start_time}
        />
        {errors.start_time && (
          <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          End Time
        </label>
        <input
          type="time"
          value={entry.end_time}
          onChange={(e) => onChange('end_time', e.target.value)}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.end_time ? 'border-red-300' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.end_time}
        />
        {errors.end_time && (
          <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Break (minutes)
        </label>
        <input
          type="number"
          min="0"
          step="15"
          value={entry.break_minutes}
          onChange={(e) => onChange('break_minutes', e.target.value)}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.break_minutes ? 'border-red-300' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.break_minutes}
        />
        {errors.break_minutes && (
          <p className="mt-1 text-sm text-red-600">{errors.break_minutes}</p>
        )}
      </div>

      <div className="col-span-6">
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <div className="flex items-center space-x-2">
            <span>Hours: {hours.toFixed(2)}</span>
            {isHoliday && (
              <span className="text-red-600">
                ({holidayRate}x rate applies{HOLIDAY_PAY_RATES.ALTERNATIVE_HOLIDAY && ' + day in lieu'})
              </span>
            )}
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mt-4">
          Description
        </label>
        <input
          type="text"
          value={entry.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Optional description of work performed"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </>
  );
}