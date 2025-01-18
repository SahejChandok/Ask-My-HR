import { Clock, DollarSign } from 'lucide-react';
import { EmployeeProfile, TimesheetEntry } from '../../types';
import { calculateHolidayPay, calculatePublicHolidayPay, isOtherwiseWorkingDay } from '../../utils/holidayPayCalculations';
import { formatCurrency } from '../../utils/formatters';

interface HolidayPaySummaryProps {
  employee: EmployeeProfile;
  entries: TimesheetEntry[];
  startDate: string;
  endDate: string;
  hours: number;
  isPublicHoliday?: boolean;
}

export function HolidayPaySummary({
  employee,
  entries,
  startDate,
  endDate,
  hours,
  isPublicHoliday = false
}: HolidayPaySummaryProps) {
  const checkDate = new Date(startDate);
  const isWorkingDay = isOtherwiseWorkingDay(entries, checkDate);

  let payDetails;
  if (isPublicHoliday) {
    const { pay, alternativeHolidayEarned } = calculatePublicHolidayPay(
      employee,
      hours,
      isWorkingDay
    );
    payDetails = {
      amount: pay,
      rate: '1.5x',
      alternativeHoliday: alternativeHolidayEarned
    };
  } else {
    const pay = calculateHolidayPay(employee, entries, hours / 8); // Convert hours to days
    payDetails = {
      amount: pay,
      rate: '1x'
    };
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          Hours: {hours}
        </div>
        <div className="flex items-center text-sm font-medium text-gray-900">
          <DollarSign className="w-4 h-4 mr-1" />
          {formatCurrency(payDetails.amount)}
          <span className="ml-2 text-xs text-gray-500">({payDetails.rate})</span>
        </div>
      </div>
      
      {isPublicHoliday && payDetails.alternativeHoliday && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-md">
          Alternative holiday (day in lieu) earned
        </div>
      )}
    </div>
  );
}