-- Add index for ACC levy tracking queries
CREATE INDEX IF NOT EXISTS idx_acc_levy_tracking_employee_year 
ON acc_levy_tracking(employee_id, tax_year);

-- Update function to handle multiple records
CREATE OR REPLACE FUNCTION get_acc_ytd_earnings(
  p_employee_id uuid,
  p_tax_year varchar DEFAULT '2024-2025'
) RETURNS numeric AS $$
DECLARE
  v_ytd_earnings numeric;
BEGIN
  SELECT COALESCE(SUM(ytd_earnings), 0) INTO v_ytd_earnings
  FROM acc_levy_tracking
  WHERE employee_id = p_employee_id
  AND tax_year = p_tax_year;

  RETURN v_ytd_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure unique constraint is enforced
ALTER TABLE acc_levy_tracking DROP CONSTRAINT IF EXISTS unique_employee_year;
ALTER TABLE acc_levy_tracking ADD CONSTRAINT unique_employee_year 
  UNIQUE (employee_id, tax_year);

-- Clean up any duplicate records by keeping the latest record
WITH duplicates AS (
  SELECT DISTINCT ON (employee_id, tax_year) 
    id,
    employee_id,
    tax_year,
    last_updated
  FROM acc_levy_tracking
  ORDER BY employee_id, tax_year, last_updated DESC
)
DELETE FROM acc_levy_tracking a
WHERE NOT EXISTS (
  SELECT 1 FROM duplicates d
  WHERE a.id = d.id
);