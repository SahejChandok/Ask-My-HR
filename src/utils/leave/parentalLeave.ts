import { PARENTAL_LEAVE } from './constants';

export interface ParentalLeaveEntitlement {
  eligible: boolean;
  primaryCarer: {
    weeks: number;
    startDate?: string;
    endDate?: string;
  };
  partner?: {
    weeks: number;
    startDate?: string;
    endDate?: string;
  };
  extendedLeave?: {
    eligible: boolean;
    maxWeeks: number;
  };
}

export function calculateParentalLeaveEntitlement(
  employmentStartDate: string,
  averageHoursPerWeek: number,
  isPrimaryCarer: boolean
): ParentalLeaveEntitlement {
  const startDate = new Date(employmentStartDate);
  const now = new Date();
  
  // Calculate months of continuous employment
  const monthsEmployed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  
  // Check 6-month eligibility criteria
  const meetsTimeRequirement = monthsEmployed >= PARENTAL_LEAVE.QUALIFYING_PERIOD;
  const meetsHoursRequirement = averageHoursPerWeek >= PARENTAL_LEAVE.HOURS_PER_WEEK;
  
  const eligible = meetsTimeRequirement && meetsHoursRequirement;

  return {
    eligible,
    primaryCarer: {
      weeks: isPrimaryCarer ? PARENTAL_LEAVE.PRIMARY_CARER : 0
    },
    partner: isPrimaryCarer ? undefined : {
      weeks: PARENTAL_LEAVE.PARTNER
    },
    extendedLeave: eligible ? {
      eligible: true,
      maxWeeks: PARENTAL_LEAVE.EXTENDED
    } : undefined
  };
}