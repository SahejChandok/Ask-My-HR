-- Update RLS policies for IRD filing tables to be role-based

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_access" ON ird_filing_config;
DROP POLICY IF EXISTS "tenant_access" ON ird_filings;
DROP POLICY IF EXISTS "tenant_access" ON ird_filing_details;

-- Create new role-based policies for ird_filing_config
CREATE POLICY "tenant_role_access" ON ird_filing_config
  FOR ALL
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create new role-based policies for ird_filings
CREATE POLICY "tenant_role_access" ON ird_filings
  FOR ALL
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create new role-based policies for ird_filing_details
CREATE POLICY "tenant_role_access" ON ird_filing_details
  FOR ALL
  USING (
    filing_id IN (
      SELECT id FROM ird_filings 
      WHERE tenant_id = get_auth_tenant_id()
    ) AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );