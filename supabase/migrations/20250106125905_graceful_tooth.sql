-- Create tenant activity table
CREATE TABLE tenant_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  type text NOT NULL CHECK (type IN ('user', 'timesheet', 'leave', 'document')),
  description text NOT NULL,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenant_activity ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "tenant_activity_access" ON tenant_activity
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Create function to log tenant activity
CREATE OR REPLACE FUNCTION log_tenant_activity(
  p_tenant_id uuid,
  p_user_id uuid,
  p_type text,
  p_description text
) RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO tenant_activity (
    tenant_id,
    user_id,
    type,
    description
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    p_description
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better query performance
CREATE INDEX idx_tenant_activity_tenant ON tenant_activity(tenant_id);
CREATE INDEX idx_tenant_activity_type ON tenant_activity(tenant_id, type);
CREATE INDEX idx_tenant_activity_created ON tenant_activity(tenant_id, created_at DESC);

-- Grant necessary permissions
GRANT ALL ON tenant_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_tenant_activity TO authenticated;