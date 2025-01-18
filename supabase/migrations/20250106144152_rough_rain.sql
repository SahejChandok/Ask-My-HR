-- Add location column to tenant_shift_config if it doesn't exist
ALTER TABLE tenant_shift_config 
ADD COLUMN IF NOT EXISTS location text DEFAULT 'all';

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_shift_config_location 
ON tenant_shift_config(tenant_id, location);

-- Update existing records to have default location
UPDATE tenant_shift_config 
SET location = 'all' 
WHERE location IS NULL;