import { LeaveBalance, LeaveType } from '../types';
import { calculateLeaveHours } from './leaveCalculations';

interface LeaveRequest {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  employee_id: string;
  tenant_id: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateLeaveRequest(
  request: Partial<LeaveRequest>,
  balances: LeaveBalance[],
  requireEmployee = false
): ValidationResult {
  const errors: Record<string, string> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  
  const start = new Date(request.start_date || '');
  const end = new Date(request.end_date || '');
  
  // Validate leave type
  if (!request.leave_type) {
    errors.leave_type = 'Please select a leave type';
  }

  // Validate dates
  if (!request.start_date || isNaN(start.getTime())) {
    errors.start_date = 'Start date is required';
  } else if (start < today) {
    errors.start_date = 'Leave cannot be requested for past dates';
  }

  if (!request.end_date || isNaN(end.getTime())) {
    errors.end_date = 'End date is required';
  } else if (end < start) {
    errors.end_date = 'End date must be after start date';
  } else if (end < today) {
    errors.end_date = 'Leave cannot be requested for past dates';
  }

  // Validate reason
  if (!request.reason?.trim()) {
    errors.reason = 'Please provide a reason for your leave request';
  } else if (request.reason.length < 5) {
    errors.reason = 'Please provide a more detailed reason';
  }

  // Validate employee selection if required
  if (requireEmployee && !request.employee_id) {
    errors.employee = 'Please select an employee';
  }

  // Validate leave balance if it's annual leave
  if (request.leave_type === 'annual' && request.start_date && request.end_date) {
    try {
      const requestedHours = calculateLeaveHours({
        start_date: request.start_date,
        end_date: request.end_date,
        leave_type: request.leave_type
      });
      
      const balance = balances.find(b => b.leave_type === 'annual');
      
      if (balance && requestedHours > balance.balance_hours) {
        errors.balance = `Insufficient leave balance. Available: ${balance.balance_hours}h, Requested: ${requestedHours}h`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error calculating leave hours';
      if (message.includes('No working days')) {
        errors.date = 'Selected dates contain no working days';
      } else {
        errors.balance = message;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}