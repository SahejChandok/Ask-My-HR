-- Add shift_rule_group_id column to employee_profiles
ALTER TABLE employee_profiles
ADD COLUMN IF NOT EXISTS shift_rule_group_id uuid REFERENCES tenant_shift_config(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_shift_group 
ON employee_profiles(shift_rule_group_id);

-- Add foreign key constraint
ALTER TABLE employee_profiles
ADD CONSTRAINT fk_employee_shift_group
FOREIGN KEY (shift_rule_group_id)
REFERENCES tenant_shift_config(id)
ON DELETE SET NULL;