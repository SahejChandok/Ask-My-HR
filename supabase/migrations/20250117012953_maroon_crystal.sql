-- Drop existing constraints and indexes safely
DO $$ BEGIN
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_tenant_location'
  ) THEN
    ALTER TABLE tenant_shift_config 
    DROP CONSTRAINT unique_tenant_location;
  END IF;

  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_tenant_name'
  ) THEN
    ALTER TABLE tenant_shift_config 
    DROP CONSTRAINT unique_tenant_name;
  END IF;
END $$;

-- Drop indexes safely
DROP INDEX IF EXISTS idx_shift_config_location;
DROP INDEX IF EXISTS idx_shift_config_tenant_name;

-- Add new unique constraint for name only
ALTER TABLE tenant_shift_config
ADD CONSTRAINT tenant_shift_config_name_key UNIQUE (tenant_id, name);

-- Create new index for tenant and name lookups
CREATE INDEX idx_tenant_shift_config_name ON tenant_shift_config(tenant_id, name);