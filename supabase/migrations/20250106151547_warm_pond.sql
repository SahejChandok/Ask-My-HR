-- Drop existing unique constraint
ALTER TABLE tenant_shift_config 
DROP CONSTRAINT IF EXISTS unique_tenant_location;

-- Add new unique constraint that includes name
ALTER TABLE tenant_shift_config
ADD CONSTRAINT unique_tenant_location_name UNIQUE (tenant_id, location, name);

-- Update indexes
DROP INDEX IF EXISTS idx_shift_config_location;
CREATE INDEX idx_shift_config_location_name ON tenant_shift_config(tenant_id, location, name);