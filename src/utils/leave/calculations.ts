import { LeaveRequest, LeaveType } from '../../types';
import { PUBLIC_HOLIDAYS } from '../holidayRules';
import { LEAVE_PAYMENT } from './constants';

/**
 * Calculate work days between two dates, excluding weekends and public holidays
 */
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

/**
 * Calculate leave payment based on greater of ordinary weekly pay
 * or average weekly earnings
 */
export function calculateLeavePay(
  ordinaryWeeklyPay: number,
  averageWeeklyEarnings: number,
  days: number
): number {
  // Use greater of ordinary pay or average earnings
  const weeklyRate = Math.max(ordinaryWeeklyPay, averageWeeklyEarnings);
  
  // Convert to daily rate (based on 5-day work week)
  const dailyRate = weeklyRate / 5;
  
  return dailyRate * days;
}

/**
 * Calculate average weekly earnings over last 52 weeks
 */
export function calculateAverageWeeklyEarnings(earnings: number[]): number {
  if (earnings.length === 0) return 0;
  
  const totalEarnings = earnings.reduce((sum, amount) => sum + amount, 0);
  return totalEarnings / earnings.length;
}

/**
 * Calculate leave hours for a request
 */
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

/**
 * Calculate total leave hours for multiple requests
 */
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