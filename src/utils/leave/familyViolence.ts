import { FAMILY_VIOLENCE_LEAVE } from './constants';

export interface FamilyViolenceLeaveEntitlement {
  eligible: boolean;
  daysAvailable: number;
  daysUsed: number;
  daysRemaining: number;
  proofRequired?: boolean;
}

export function calculateFamilyViolenceLeave(
  employmentStartDate: string,
  leaveUsed: number
): FamilyViolenceLeaveEntitlement {
  const startDate = new Date(employmentStartDate);
  const now = new Date();
  
  // Calculate months of continuous employment
  const monthsEmployed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  
  // Check eligibility
  const eligible = monthsEmployed >= FAMILY_VIOLENCE_LEAVE.QUALIFYING_PERIOD;
  
  if (!eligible) {
    return {
      eligible: false,
      daysAvailable: 0,
      daysUsed: 0,
      daysRemaining: 0
    };
  }

  const daysAvailable = FAMILY_VIOLENCE_LEAVE.DAYS_PER_YEAR;
  const daysRemaining = Math.max(0, daysAvailable - leaveUsed);

  return {
    eligible: true,
    daysAvailable,
    daysUsed: leaveUsed,
    daysRemaining,
    proofRequired: FAMILY_VIOLENCE_LEAVE.PROOF_MAY_BE_REQUESTED
  };
}