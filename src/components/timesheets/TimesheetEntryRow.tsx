import { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { TimesheetEntry } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatHours, formatCurrency } from '../../utils/formatters';
import { PublicHolidayBadge } from '../leave/PublicHolidayBadge';
import { calculateHoursWorked } from '../../utils/timesheetCalculations';
import { PUBLIC_HOLIDAYS_2024 } from '../../utils/holidayRules';

interface TimesheetEntryRowProps {
  entry: TimesheetEntry;
  hourlyRate: number;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<TimesheetEntry>) => void;
  onDelete?: () => void;
}

export function TimesheetEntryRow({
  entry,
  hourlyRate,
  isEditing = false,
  onUpdate,
  onDelete
}: TimesheetEntryRowProps) {
  const [error, setError] = useState<string>();
  
  const isPublicHoliday = PUBLIC_HOLIDAYS_2024.some(h => h.date === entry.date);
  const hoursWorked = calculateHoursWorked(entry);
  const payRate = isPublicHoliday ? hourlyRate * 1.5 : hourlyRate;
  const totalPay = hoursWorked * payRate;

  function handleTimeChange(field: 'start_time' | 'end_time', value: string) {
    try {
      const updatedEntry = { ...entry, [field]: value };
      calculateHoursWorked(updatedEntry); // Validate times
      setError(undefined);
      onUpdate?.({ [field]: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid time');
    }
  }

  function handleBreakChange(minutes: number) {
    try {
      const updatedEntry = { ...entry, break_minutes: minutes };
      calculateHoursWorked(updatedEntry); // Validate break
      setError(undefined);
      onUpdate?.({ break_minutes: minutes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid break duration');
    }
  }

  return (
    <tr className={isPublicHoliday ? 'bg-red-50' : undefined}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDisplayDate(entry.date)}
        {isPublicHoliday && (
          <PublicHolidayBadge date={entry.date} className="ml-2" />
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="time"
            value={entry.start_time}
            onChange={(e) => handleTimeChange('start_time', e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        ) : (
          entry.start_time
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="time"
            value={entry.end_time}
            onChange={(e) => handleTimeChange('end_time', e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        ) : (
          entry.end_time
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="number"
            value={entry.break_minutes}
            onChange={(e) => handleBreakChange(parseInt(e.target.value))}
            min="0"
            step="15"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        ) : (
          entry.break_minutes
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1 text-gray-400" />
          <span className="font-medium text-gray-900">
            {formatHours(hoursWorked)}
          </span>
          {isPublicHoliday && (
            <span className="ml-2 text-xs text-red-600 font-medium">
              (1.5x)
            </span>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatCurrency(totalPay)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <input
            type="text"
            value={entry.description || ''}
            onChange={(e) => onUpdate?.({ description: e.target.value })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        ) : (
          entry.description
        )}
      </td>

      {error && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        </td>
      )}
    </tr>
  );
}