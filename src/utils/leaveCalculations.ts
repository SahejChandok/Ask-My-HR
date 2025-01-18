import { LeaveRequest } from '../types';
import { PUBLIC_HOLIDAYS } from './holidayRules';

// Calculate business days between two dates
export function calculateWorkDays(startDate: Date, endDate: Date): number {
  let workDays = 0;
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  // Ensure dates are set to start of day for consistent comparison
  currentDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= lastDate) {
    const day = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Skip weekends and public holidays
    if (day !== 0 && day !== 6 && !PUBLIC_HOLIDAYS.find(h => h.date === dateStr)) {
      workDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workDays;
}

export function calculateLeaveHours(request: Partial<LeaveRequest>): number {
  if (!request.start_date || !request.end_date) {
    throw new Error('Invalid leave request: Missing dates');
  }

  const startDate = new Date(request.start_date);
  const endDate = new Date(request.end_date);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid leave request: Invalid date format');
  }
  
  if (endDate < startDate) {
    throw new Error('Invalid leave request: End date must be after start date');
  }
  
  const workDays = calculateWorkDays(startDate, endDate);
  if (workDays === 0) {
    throw new Error('No working days found in selected date range');
  }

  // Standard 8-hour workday
  const leaveHours = workDays * 8;

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(leaveHours * 100) / 100;

}

export function calculateTotalLeaveHours(requests: LeaveRequest[]): number {
  return requests.reduce((total, request) => {
    if (request.status === 'approved' || request.status === 'pending') {
      try {
        return total + calculateLeaveHours(request);
      } catch (error) {
        console.error('Error calculating leave hours:', error);
        return total;
      }
    }
    return total;
  }, 0);
}