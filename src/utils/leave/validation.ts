import { LeaveRequest, LeaveType } from '../../types';
import { 
  ANNUAL_LEAVE,
  SICK_LEAVE,
  BEREAVEMENT_LEAVE,
  FAMILY_VIOLENCE_LEAVE,
  LEAVE_REQUEST
} from './constants';
import { calculateWorkDays } from './calculations';

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateLeaveRequest(
  request: Partial<LeaveRequest>,
  employmentStartDate: string,
  currentLeaveBalance: number,
  leaveType: LeaveType
): ValidationResult {
  const errors: Record<string, string> = {};
  const today = new Date();
  const startDate = new Date(request.start_date || '');
  const endDate = new Date(request.end_date || '');
  const employmentStart = new Date(employmentStartDate);

  // Basic date validation
  if (!request.start_date || isNaN(startDate.getTime())) {
    errors.start_date = 'Start date is required';
  }
  if (!request.end_date || isNaN(endDate.getTime())) {
    errors.end_date = 'End date is required';
  }
  if (endDate < startDate) {
    errors.end_date = 'End date must be after start date';
  }

  // Calculate months of service
  const monthsEmployed = Math.floor(
    (today.getTime() - employmentStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  // Validate qualifying period
  const qualifyingPeriods = {
    annual: ANNUAL_LEAVE.CONTINUOUS_WORK,
    sick: SICK_LEAVE.QUALIFYING_PERIOD,
    bereavement: BEREAVEMENT_LEAVE.QUALIFYING_PERIOD,
    family_violence: FAMILY_VIOLENCE_LEAVE.QUALIFYING_PERIOD
  };

  if (monthsEmployed < (qualifyingPeriods[leaveType] || 0)) {
    errors.qualifying = `Must be employed for ${qualifyingPeriods[leaveType]} months to take ${leaveType} leave`;
  }

  // Validate notice period for annual leave
  if (leaveType === 'annual') {
    const noticeGiven = Math.floor(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (noticeGiven < LEAVE_REQUEST.MIN_NOTICE_DAYS) {
      errors.notice = `Annual leave requests require ${LEAVE_REQUEST.MIN_NOTICE_DAYS} days notice`;
    }
  }

  // Validate future booking limit
  const daysInFuture = Math.floor(
    (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysInFuture > LEAVE_REQUEST.MAX_FUTURE_DAYS) {
    errors.future = `Leave cannot be booked more than ${LEAVE_REQUEST.MAX_FUTURE_DAYS} days in advance`;
  }

  // Validate leave balance for annual leave
  if (leaveType === 'annual') {
    const workDays = calculateWorkDays(startDate, endDate);
    const hoursRequested = workDays * 8; // Standard 8-hour day
    if (hoursRequested > currentLeaveBalance) {
      errors.balance = `Insufficient leave balance. Available: ${currentLeaveBalance}h, Requested: ${hoursRequested}h`;
    }
  }

  // Validate bereavement leave duration
  if (leaveType === 'bereavement') {
    const workDays = calculateWorkDays(startDate, endDate);
    const maxDays = request.immediate_family ? 
      BEREAVEMENT_LEAVE.IMMEDIATE_FAMILY : 
      BEREAVEMENT_LEAVE.OTHER;
    if (workDays > maxDays) {
      errors.duration = `Maximum ${maxDays} days allowed for this type of bereavement leave`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}