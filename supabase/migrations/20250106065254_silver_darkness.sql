-- Drop existing policies
DROP POLICY IF EXISTS "tenant_role_access" ON ird_filing_config;
DROP POLICY IF EXISTS "tenant_role_access" ON ird_filings;
DROP POLICY IF EXISTS "tenant_role_access" ON ird_filing_details;

-- Create optimized role-based policies for ird_filing_config
CREATE POLICY "tenant_role_access" ON ird_filing_config
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create optimized role-based policies for ird_filings
CREATE POLICY "tenant_role_access" ON ird_filings
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create optimized role-based policies for ird_filing_details
CREATE POLICY "tenant_role_access" ON ird_filing_details
  FOR ALL
  USING (
    filing_id IN (
      SELECT f.id 
      FROM ird_filings f
      JOIN users u ON f.tenant_id = u.tenant_id
      WHERE u.id = auth.uid()
      AND u.role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Add indexes to support the policies
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_ird_filings_tenant ON ird_filings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ird_filing_details_filing ON ird_filing_details(filing_id);