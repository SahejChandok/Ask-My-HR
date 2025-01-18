import { useMemo } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { TimesheetEntry } from '../../types';
import { calculateWeeklyOvertime } from '../../utils/overtimeCalculations';
import { formatHours, formatCurrency, formatPayRate } from '../../utils/formatters';

interface WeeklyTotalsProps {
  entries: TimesheetEntry[];
  weekStartDate: string;
  hourlyRate: number;
}

export function WeeklyTotals({ entries, weekStartDate, hourlyRate }: WeeklyTotalsProps) {
  const totals = useMemo(() => 
    calculateWeeklyOvertime(entries, weekStartDate),
    [entries, weekStartDate]
  );

  const regularPay = totals.regularHours * hourlyRate;
  const overtimePay = totals.overtimeHours * hourlyRate * 1.5;
  const doubleTimePay = totals.doubleTimeHours * hourlyRate * 2;
  const totalPay = regularPay + overtimePay + doubleTimePay;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Totals</h4>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            Regular Hours
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-900">{formatHours(totals.regularHours)}</span>
            <span className="ml-2 text-xs text-gray-500">({formatPayRate(1)})</span>
          </div>
        </div>

        {totals.overtimeHours > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Overtime Hours
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-900">{formatHours(totals.overtimeHours)}</span>
              <span className="ml-2 text-xs text-gray-500">({formatPayRate(1.5)})</span>
            </div>
          </div>
        )}

        {totals.doubleTimeHours > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Double Time Hours
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-900">{formatHours(totals.doubleTimeHours)}</span>
              <span className="ml-2 text-xs text-gray-500">({formatPayRate(2)})</span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center font-medium">
            <div className="flex items-center text-sm text-gray-900">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Pay
            </div>
            <span className="text-sm text-gray-900">{formatCurrency(totalPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}