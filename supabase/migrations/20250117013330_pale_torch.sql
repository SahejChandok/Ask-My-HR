-- Add tenant_id column to payslips table
ALTER TABLE payslips
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_payslips_tenant ON payslips(tenant_id);

-- Update existing payslips with tenant_id from payroll runs
UPDATE payslips p
SET tenant_id = pr.tenant_id
FROM payroll_runs pr
WHERE p.payroll_run_id = pr.id
AND p.tenant_id IS NULL;

-- Make tenant_id required for future records
ALTER TABLE payslips
ALTER COLUMN tenant_id SET NOT NULL;

-- Add RLS policy for tenant access
DROP POLICY IF EXISTS "tenant_access_policy" ON payslips;
CREATE POLICY "tenant_access_policy" ON payslips
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());