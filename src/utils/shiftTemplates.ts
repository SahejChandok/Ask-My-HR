import { TenantShiftConfig } from '../types/shift';

// Industry-specific shift rule templates
export const SHIFT_TEMPLATES: Record<string, Partial<TenantShiftConfig>> = {
  healthcare: {
    name: 'Healthcare Template',
    timeRules: {
      standardHours: {
        daily: 12,
        weekly: 40,
        fortnightly: 80
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: true,
        breakFrequency: 4,
        maxWorkBeforeBreak: 6,
        additionalBreaks: [
          { hours: 6, duration: 30, paid: true },
          { hours: 10, duration: 15, paid: true }
        ]
      },
      overtimeThresholds: {
        daily: 12,
        weekly: 40,
        fortnightly: 80
      }
    },
    rateMultipliers: {
      overtime: {
        rate1: 1.5,
        rate2: 2.0,
        threshold: 4
      },
      weekend: {
        saturday: 1.5,
        sunday: 2.0
      },
      publicHoliday: {
        rate: 2.5,
        alternativeHoliday: true
      },
      nightShift: {
        rate: 1.25,
        loadingAllowance: 35.00,
        mealAllowance: 20.00,
        startTime: "22:00",
        endTime: "07:00"
      },
      specialRates: {
        onCall: 1.5,
        emergencyCallout: 2.5,
        trainingDays: 1.0
      }
    }
  },

  manufacturing: {
    name: '24/7 Manufacturing Template',
    timeRules: {
      standardHours: {
        daily: 8,
        weekly: 40,
        fortnightly: 80
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: false,
        breakFrequency: 4,
        maxWorkBeforeBreak: 5,
        additionalBreaks: [
          { hours: 4, duration: 15, paid: true }
        ]
      },
      overtimeThresholds: {
        daily: 8,
        weekly: 40
      }
    },
    rateMultipliers: {
      overtime: {
        rate1: 1.5,
        rate2: 2.0,
        threshold: 4
      },
      weekend: {
        saturday: 1.5,
        sunday: 2.0
      },
      publicHoliday: {
        rate: 2.0,
        alternativeHoliday: true
      },
      nightShift: {
        rate: 1.15,
        loadingAllowance: 25.00,
        mealAllowance: 15.00,
        startTime: "22:00",
        endTime: "06:00"
      }
    }
  },

  education: {
    name: 'Education Template',
    timeRules: {
      standardHours: {
        daily: 8,
        weekly: 40,
        fortnightly: 80
      },
      breakRules: {
        minimumBreak: 45,
        paidBreak: true,
        breakFrequency: 3,
        maxWorkBeforeBreak: 3,
        additionalBreaks: [
          { hours: 3, duration: 15, paid: true },
          { hours: 6, duration: 30, paid: true }
        ]
      },
      overtimeThresholds: {
        daily: 8,
        weekly: 40
      }
    },
    rateMultipliers: {
      overtime: {
        rate1: 1.25,
        rate2: 1.5,
        threshold: 3
      },
      weekend: {
        saturday: 1.5,
        sunday: 2.0
      },
      publicHoliday: {
        rate: 2.0,
        alternativeHoliday: true
      }
    }
  },

  security: {
    name: 'Security Services Template',
    timeRules: {
      standardHours: {
        daily: 12,
        weekly: 42,
        fortnightly: 84
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: true,
        breakFrequency: 6,
        maxWorkBeforeBreak: 6,
        additionalBreaks: [
          { hours: 6, duration: 20, paid: true }
        ]
      },
      overtimeThresholds: {
        daily: 12,
        weekly: 42
      }
    },
    rateMultipliers: {
      overtime: {
        rate1: 1.5,
        rate2: 2.0,
        threshold: 4
      },
      weekend: {
        saturday: 1.25,
        sunday: 1.5
      },
      publicHoliday: {
        rate: 2.0,
        alternativeHoliday: true
      },
      nightShift: {
        rate: 1.2,
        loadingAllowance: 30.00,
        mealAllowance: 18.00,
        startTime: "20:00",
        endTime: "06:00"
      },
      specialRates: {
        onCall: 1.3,
        emergencyCallout: 2.0,
        trainingDays: 1.0
      }
    }
  },

  remote: {
    name: 'Remote Work Template',
    timeRules: {
      standardHours: {
        daily: 7.5,
        weekly: 37.5,
        fortnightly: 75
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: false,
        breakFrequency: 4,
        maxWorkBeforeBreak: 4,
        additionalBreaks: [
          { hours: 4, duration: 15, paid: false }
        ]
      },
      overtimeThresholds: {
        daily: 7.5,
        weekly: 37.5
      }
    },
    rateMultipliers: {
      overtime: {
        rate1: 1.5,
        rate2: 2.0,
        threshold: 3
      },
      weekend: {
        saturday: 1.5,
        sunday: 2.0
      },
      publicHoliday: {
        rate: 2.0,
        alternativeHoliday: true
      }
    }
  }
};

// Helper function to get template by industry
export function getIndustryTemplate(industry: keyof typeof SHIFT_TEMPLATES): Partial<TenantShiftConfig> {
  return SHIFT_TEMPLATES[industry] || SHIFT_TEMPLATES.manufacturing;
}

// Helper function to customize template for location
export function customizeTemplateForLocation(
  template: Partial<TenantShiftConfig>,
  location: string
): Partial<TenantShiftConfig> {
  const customized = { ...template };

  // Add location-specific holidays and rules
  if (location === 'auckland') {
    customized.rateMultipliers = {
      ...customized.rateMultipliers,
      regionalHolidays: {
        auckland: {
          anniversaryDay: true,
          waitangiDay: true
        }
      }
    };
  }

  return customized;
}