import { ACC } from './constants';

interface ACCLevyResult {
  levy: number;
  ytdEarnings: number;
  remainingCap: number;
  details: {
    levyRate: number;
    cappedEarnings: number;
    periodType: string;
  };
}

interface ACCLevyResult {
  levy: number;
  ytdEarnings: number;
  remainingCap: number;
  details: {
    levyRate: number;
    cappedEarnings: number;
    periodType: string;
  };
}

import { ACC } from './constants';

interface ACCLevyResult {
  levy: number;
  ytdEarnings: number;
  remainingCap: number;
  details: {
    levyRate: number;
    cappedEarnings: number;
    periodType: string;
  };
}

/**
 * Calculate ACC levy with YTD tracking
/**
 * Calculate ACC levy with YTD tracking
 * Uses current NZ rates and thresholds
 */
export function calculateACCLevyWithYTD(
  grossPay: number,
  ytdEarnings: number,
  payPeriod: 'weekly' | 'fortnightly' | 'monthly' = 'fortnightly'
): ACCLevyResult {
  // Calculate remaining room under cap
  const remainingCap = Math.max(0, ACC.MAX_EARNINGS - ytdEarnings);
  
  // Cap the earnings for levy calculation
  const cappedEarnings = Math.min(grossPay, remainingCap);
  
  // Calculate levy
  const levy = cappedEarnings * ACC.EARNERS_LEVY;
  
  // Update YTD earnings
  const newYTDEarnings = Math.min(ytdEarnings + grossPay, ACC.MAX_EARNINGS);

  return {
    levy: round(levy),
    ytdEarnings: newYTDEarnings,
    remainingCap,
    details: {
      levyRate: ACC.EARNERS_LEVY,
      cappedEarnings,
      periodType: payPeriod
    }
  };
}

// Helper function to round to 2 decimal places
const round = (num: number) => Math.round(num * 100) / 100;