import { Calendar } from 'lucide-react';
import { PUBLIC_HOLIDAYS } from '../../utils/holidayRules';

interface PublicHolidayBadgeProps {
  date: string;
  className?: string;
}

export function PublicHolidayBadge({ date, className = '' }: PublicHolidayBadgeProps) {
  const holiday = PUBLIC_HOLIDAYS.find(h => h.date === date);
  
  if (!holiday) return null;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}>
      <Calendar className="w-3 h-3 mr-1" />
      {holiday.name}
    </div>
  );
}