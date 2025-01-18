-- Create development-aware policies for ird_filing_config
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filing_config;
CREATE POLICY "ird_access_policy" ON ird_filing_config
  FOR ALL
  USING (
    is_dev_mode() OR (
      tenant_id IN (
        SELECT tenant_id 
        FROM users
        WHERE id = auth.uid()
        AND role IN ('platform_admin', 'tenant_admin')
      )
    )
  );

-- Create development-aware policies for ird_filings
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filings;
CREATE POLICY "ird_access_policy" ON ird_filings
  FOR ALL
  USING (
    is_dev_mode() OR (
      tenant_id IN (
        SELECT tenant_id 
        FROM users
        WHERE id = auth.uid()
        AND role IN ('platform_admin', 'tenant_admin')
      )
    )
  );

-- Create development-aware policies for ird_filing_details
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filing_details;
CREATE POLICY "ird_access_policy" ON ird_filing_details
  FOR ALL
  USING (
    is_dev_mode() OR (
      filing_id IN (
        SELECT f.id 
        FROM ird_filings f
        JOIN users u ON f.tenant_id = u.tenant_id
        WHERE u.id = auth.uid()
        AND u.role IN ('platform_admin', 'tenant_admin')
      )
    )
  );