-- Create function to update leave balances
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  leave_hours numeric;
BEGIN
  -- Only process approved leave requests
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Calculate work days between start and end date
    WITH RECURSIVE dates AS (
      SELECT NEW.start_date AS date
      UNION ALL
      SELECT date + 1
      FROM dates
      WHERE date < NEW.end_date
    ),
    workdays AS (
      SELECT count(*) as days
      FROM dates
      WHERE extract(dow FROM date) NOT IN (0, 6) -- Exclude weekends
    )
    SELECT days * 8 INTO leave_hours FROM workdays;

    -- Update leave balance
    UPDATE leave_balances
    SET 
      taken_hours = taken_hours + leave_hours,
      balance_hours = accrued_hours - (taken_hours + leave_hours),
      updated_at = now()
    WHERE 
      employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year_start <= NEW.start_date
      AND year_end >= NEW.end_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for leave request status changes
DROP TRIGGER IF EXISTS leave_balance_update_trigger ON leave_requests;
CREATE TRIGGER leave_balance_update_trigger
  AFTER UPDATE OF status ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance();

-- Recalculate all leave balances
DO $$
DECLARE
  r RECORD;
  leave_hours numeric;
BEGIN
  -- Reset all taken hours to 0
  UPDATE leave_balances SET taken_hours = 0, balance_hours = accrued_hours;
  
  -- Recalculate taken hours from approved leave requests
  FOR r IN 
    SELECT 
      lr.employee_id,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lb.accrued_hours
    FROM leave_requests lr
    JOIN leave_balances lb ON 
      lr.employee_id = lb.employee_id 
      AND lr.leave_type = lb.leave_type
    WHERE lr.status = 'approved'
    ORDER BY lr.start_date
  LOOP
    -- Calculate work days between start and end date
    WITH RECURSIVE dates AS (
      SELECT r.start_date AS date
      UNION ALL
      SELECT date + 1
      FROM dates
      WHERE date < r.end_date
    ),
    workdays AS (
      SELECT count(*) as days
      FROM dates
      WHERE extract(dow FROM date) NOT IN (0, 6)
    )
    SELECT days * 8 INTO leave_hours FROM workdays;

    -- Update balance
    UPDATE leave_balances
    SET 
      taken_hours = taken_hours + leave_hours,
      balance_hours = accrued_hours - (taken_hours + leave_hours),
      updated_at = now()
    WHERE 
      employee_id = r.employee_id
      AND leave_type = r.leave_type
      AND year_start <= r.start_date
      AND year_end >= r.end_date;
  END LOOP;
END $$;