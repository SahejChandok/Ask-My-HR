-- Drop existing table if it exists
DROP TABLE IF EXISTS tenant_shift_config CASCADE;

-- Create tenant shift configuration table with correct column names
CREATE TABLE tenant_shift_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  location text DEFAULT 'all',
  time_rules jsonb NOT NULL DEFAULT '{
    "standardHours": {
      "daily": 8,
      "weekly": 40,
      "fortnightly": 80
    },
    "breakRules": {
      "minimumBreak": 30,
      "paidBreak": false,
      "breakFrequency": 4,
      "maxWorkBeforeBreak": 5
    },
    "overtimeThresholds": {
      "daily": 8,
      "weekly": 40,
      "fortnightly": 80
    }
  }'::jsonb,
  rate_multipliers jsonb NOT NULL DEFAULT '{
    "overtime": {
      "rate1": 1.5,
      "rate2": 2.0,
      "threshold": 4
    },
    "weekend": {
      "saturday": 1.25,
      "sunday": 1.5
    },
    "publicHoliday": {
      "rate": 2.0,
      "alternativeHoliday": true
    },
    "nightShift": {
      "rate": 1.15,
      "loadingAllowance": 25.00,
      "mealAllowance": 15.00,
      "startTime": "22:00",
      "endTime": "06:00"
    }
  }'::jsonb,
  allowances jsonb NOT NULL DEFAULT '{
    "mealAllowance": {
      "amount": 15.00,
      "minimumHours": 8
    },
    "transportAllowance": {
      "amount": 10.00,
      "applicableShifts": ["night", "weekend"]
    }
  }'::jsonb,
  roster_rules jsonb NOT NULL DEFAULT '{
    "minimumRestPeriod": 11,
    "maximumConsecutiveDays": 7,
    "maximumWeeklyHours": 50,
    "noticeRequired": 48,
    "preferredDaysOff": ["Saturday", "Sunday"]
  }'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_location UNIQUE (tenant_id, location)
);

-- Enable RLS
ALTER TABLE tenant_shift_config ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "tenant_access_policy" ON tenant_shift_config
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Add indexes
CREATE INDEX idx_shift_config_tenant ON tenant_shift_config(tenant_id);
CREATE INDEX idx_shift_config_location ON tenant_shift_config(tenant_id, location);

-- Add default configuration for demo tenant if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenant_shift_config 
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  ) THEN
    INSERT INTO tenant_shift_config (
      tenant_id,
      name,
      location,
      time_rules,
      rate_multipliers,
      allowances,
      roster_rules
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'Default Configuration',
      'all',
      '{
        "standardHours": {
          "daily": 8,
          "weekly": 40,
          "fortnightly": 80
        },
        "breakRules": {
          "minimumBreak": 30,
          "paidBreak": false,
          "breakFrequency": 4,
          "maxWorkBeforeBreak": 5
        },
        "overtimeThresholds": {
          "daily": 8,
          "weekly": 40,
          "fortnightly": 80
        }
      }'::jsonb,
      '{
        "overtime": {
          "rate1": 1.5,
          "rate2": 2.0,
          "threshold": 4
        },
        "weekend": {
          "saturday": 1.25,
          "sunday": 1.5
        },
        "publicHoliday": {
          "rate": 2.0,
          "alternativeHoliday": true
        },
        "nightShift": {
          "rate": 1.15,
          "loadingAllowance": 25.00,
          "mealAllowance": 15.00,
          "startTime": "22:00",
          "endTime": "06:00"
        }
      }'::jsonb,
      '{
        "mealAllowance": {
          "amount": 15.00,
          "minimumHours": 8
        },
        "transportAllowance": {
          "amount": 10.00,
          "applicableShifts": ["night", "weekend"]
        }
      }'::jsonb,
      '{
        "minimumRestPeriod": 11,
        "maximumConsecutiveDays": 7,
        "maximumWeeklyHours": 50,
        "noticeRequired": 48,
        "preferredDaysOff": ["Saturday", "Sunday"]
      }'::jsonb
    );
  END IF;
END $$;