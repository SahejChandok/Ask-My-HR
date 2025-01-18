import React from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { PublicHolidayBadge } from '../leave/PublicHolidayBadge';
import { isPublicHoliday } from '../../utils/holidayRules';
import { calculateHoursWorked, calculateShiftPay } from '../../utils/timesheetCalculations';
import { TenantShiftConfig } from '../../types/shift';
import { formatCurrency } from '../../utils/formatters';

interface TimesheetEntryProps {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  description: string;
  shiftRules?: TenantShiftConfig;
  hourlyRate: number;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onBreakChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function TimesheetEntry({
  date,
  startTime,
  endTime,
  breakMinutes,
  description,
  shiftRules,
  hourlyRate,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onBreakChange,
  onDescriptionChange
}: TimesheetEntryProps) {
  const hours = calculateHoursWorked({
    start_time: startTime,
    end_time: endTime,
    break_minutes: parseInt(breakMinutes)
  });

  // Calculate pay with shift rules
  const payDetails = calculateShiftPay({
    date,
    startTime,
    endTime,
    breakMinutes: parseInt(breakMinutes),
    hourlyRate,
    shiftRules
  });

  return (
    <div className="grid grid-cols-6 gap-4">
      <div className="col-span-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          {isHoliday && <PublicHolidayBadge date={date} />}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Start
        </label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          End
        </label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Break (min)
        </label>
        <input
          type="number"
          min="0"
          step="15"
          value={breakMinutes}
          onChange={(e) => onBreakChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="col-span-6">
        <div className="mt-2 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>Hours: {hours.toFixed(2)}h</span>
            {payDetails.rateMultiplier > 1 && (
              <span className="ml-2 text-indigo-600">
                ({payDetails.rateMultiplier}x rate)
              </span>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <DollarSign className="w-4 h-4 mr-2" />
            <div>
              <span>Base Pay: {formatCurrency(payDetails.basePay)}</span>
              {payDetails.loadedPay > payDetails.basePay && (
                <span className="ml-2 text-indigo-600">
                  (with loading = {formatCurrency(payDetails.loadedPay)})
                </span>
              )}
              {payDetails.allowances.length > 0 && (
                <div className="text-xs text-gray-500">
                  {payDetails.allowances.map(a => (
                    <div key={a.name}>
                      + {a.name}: {formatCurrency(a.amount)}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-1 font-medium">
                Total: {formatCurrency(payDetails.totalPay)}
              </div>
            </div>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
}