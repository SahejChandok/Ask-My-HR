-- Create function to check development mode
CREATE OR REPLACE FUNCTION is_dev_mode()
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.settings.development', true) = 'true';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to check if user has IRD access
CREATE OR REPLACE FUNCTION has_ird_access()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('platform_admin', 'tenant_admin')
  ) OR is_dev_mode();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filing_config;
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filings;
DROP POLICY IF EXISTS "ird_access_policy" ON ird_filing_details;

-- Create development-aware policies for ird_filing_config
CREATE POLICY "ird_access_policy" ON ird_filing_config
  FOR ALL
  USING (
    has_ird_access() AND (
      is_dev_mode() OR tenant_id = get_auth_tenant_id()
    )
  );

-- Create development-aware policies for ird_filings
CREATE POLICY "ird_access_policy" ON ird_filings
  FOR ALL
  USING (
    has_ird_access() AND (
      is_dev_mode() OR tenant_id = get_auth_tenant_id()
    )
  );

-- Create development-aware policies for ird_filing_details
CREATE POLICY "ird_access_policy" ON ird_filing_details
  FOR ALL
  USING (
    has_ird_access() AND (
      is_dev_mode() OR filing_id IN (
        SELECT id FROM ird_filings 
        WHERE tenant_id = get_auth_tenant_id()
      )
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_dev_mode() TO authenticated;
GRANT EXECUTE ON FUNCTION has_ird_access() TO authenticated;