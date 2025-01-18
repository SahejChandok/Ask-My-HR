-- Create shift types enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM (
    'regular',
    'overtime',
    'night',
    'weekend',
    'public_holiday',
    'on_call',
    'standby',
    'split',
    'rotating',
    'flexible'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create tenant shift configuration table
CREATE TABLE IF NOT EXISTS tenant_shift_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  time_rules jsonb NOT NULL,
  rate_multipliers jsonb NOT NULL,
  allowances jsonb NOT NULL,
  roster_rules jsonb NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE tenant_shift_config ADD CONSTRAINT tenant_shift_config_tenant_id_key UNIQUE (tenant_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Create employee shift overrides table
CREATE TABLE IF NOT EXISTS employee_shift_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id),
  standard_hours jsonb,
  rate_multipliers jsonb,
  allowances jsonb,
  restrictions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE employee_shift_overrides ADD CONSTRAINT employee_shift_overrides_employee_id_key UNIQUE (employee_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Create shift entries table
CREATE TABLE IF NOT EXISTS shift_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id),
  tenant_id uuid REFERENCES tenants(id),
  shift_type shift_type NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_minutes integer DEFAULT 0,
  location text,
  notes text,
  allowances text[],
  rate_multiplier numeric(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenant_shift_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shift_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_entries ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "tenant_access_policy" ON tenant_shift_config
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "employee_override_access" ON employee_shift_overrides
  FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employee_profiles 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

CREATE POLICY "shift_entries_access" ON shift_entries
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shift_entries_employee ON shift_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_entries_tenant ON shift_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_entries_date ON shift_entries(date);
CREATE INDEX IF NOT EXISTS idx_shift_entries_type ON shift_entries(shift_type);

-- Add default shift config for demo tenant
INSERT INTO tenant_shift_config (
  tenant_id,
  name,
  time_rules,
  rate_multipliers,
  allowances,
  roster_rules
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Default Configuration',
  '{
    "standardHours": {
      "daily": 8,
      "weekly": 40
    },
    "breakRules": {
      "minimumBreak": 30,
      "paidBreak": false,
      "breakFrequency": 4,
      "maxWorkBeforeBreak": 5
    },
    "overtimeThresholds": {
      "daily": 8,
      "weekly": 40
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
) ON CONFLICT (tenant_id) DO UPDATE SET
  updated_at = now();