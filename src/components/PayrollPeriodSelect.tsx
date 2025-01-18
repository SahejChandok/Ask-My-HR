import React from 'react';
import { PayPeriodType } from '../types';
import { formatDisplayDate, formatAPIDate, calculatePeriodEndDate } from '../utils/dateUtils';

interface PayrollPeriodSelectProps {
  periodType: PayPeriodType;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function PayrollPeriodSelect({
  periodType,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PayrollPeriodSelectProps) {
  function handleStartDateChange(newStartDate: string) {
    const start = new Date(newStartDate);
    start.setHours(0, 0, 0, 0);
    const end = calculatePeriodEndDate(start, periodType);
    
    onStartDateChange(formatAPIDate(start));
    onEndDateChange(formatAPIDate(end));
  }

  // Ensure end date is calculated when component mounts
  React.useEffect(() => {
    if (startDate && !endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = calculatePeriodEndDate(start, periodType);
      onEndDateChange(formatAPIDate(end));
    }
  }, [startDate, endDate, periodType, onEndDateChange]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          {formatDisplayDate(startDate)}
        </p>
      </div>
      <div>
        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          disabled
          className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 bg-gray-50 cursor-not-allowed sm:text-sm text-gray-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          {formatDisplayDate(endDate)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          End date is automatically calculated based on period type
        </p>
      </div>
    </div>
  );
}