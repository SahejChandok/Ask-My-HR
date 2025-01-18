-- Create tenant activity table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tenant_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id),
    type text NOT NULL CHECK (type IN ('user', 'timesheet', 'leave', 'document')),
    description text NOT NULL,
    user_id uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE tenant_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "tenant_activity_access" ON tenant_activity;

-- Add RLS policy
CREATE POLICY "tenant_activity_access" ON tenant_activity
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Create admin metrics table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS admin_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id),
    active_employees integer DEFAULT 0,
    pending_timesheets integer DEFAULT 0,
    pending_leave integer DEFAULT 0,
    monthly_payroll numeric(12,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_tenant_metrics UNIQUE (tenant_id)
  );
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "admin_metrics_access" ON admin_metrics;

-- Add RLS policy
CREATE POLICY "admin_metrics_access" ON admin_metrics
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Add indexes for better performance if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tenant_activity_tenant ON tenant_activity(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_tenant_activity_type ON tenant_activity(tenant_id, type);
  CREATE INDEX IF NOT EXISTS idx_tenant_activity_created ON tenant_activity(tenant_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_admin_metrics_tenant ON admin_metrics(tenant_id);
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Grant necessary permissions
GRANT ALL ON tenant_activity TO authenticated;
GRANT ALL ON admin_metrics TO authenticated;