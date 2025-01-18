interface ShiftLoadingRules {
  weekendRate: number;
  nightRate: number;
  publicHolidayRate: number;
  nightStartHour: number;
  nightEndHour: number;
}

const DEFAULT_SHIFT_RULES: ShiftLoadingRules = {
  weekendRate: 1.25,      // 25% loading for weekend work
  nightRate: 1.15,        // 15% loading for night shift
  publicHolidayRate: 1.5, // 50% loading for public holidays
  nightStartHour: 22,     // Night shift starts at 10 PM
  nightEndHour: 6         // Night shift ends at 6 AM
};

export function calculateShiftLoading(
  baseRate: number,
  startTime: string,
  endTime: string,
  date: string,
  rules: ShiftLoadingRules = DEFAULT_SHIFT_RULES
): {
  loadedRate: number;
  loadingDetails: {
    weekend?: number;
    night?: number;
    publicHoliday?: number;
  };
} {
  let loadedRate = baseRate;
  const loadingDetails: Record<string, number> = {};

  // Check if weekend
  const day = new Date(date).getDay();
  if (day === 0 || day === 6) {
    loadingDetails.weekend = baseRate * (rules.weekendRate - 1);
    loadedRate *= rules.weekendRate;
  }

  // Check if night shift
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  if (startHour >= rules.nightStartHour || endHour <= rules.nightEndHour) {
    loadingDetails.night = baseRate * (rules.nightRate - 1);
    loadedRate *= rules.nightRate;
  }

  // Check if public holiday
  if (isPublicHoliday(date)) {
    loadingDetails.publicHoliday = baseRate * (rules.publicHolidayRate - 1);
    loadedRate *= rules.publicHolidayRate;
  }

  return {
    loadedRate,
    loadingDetails
  };
}