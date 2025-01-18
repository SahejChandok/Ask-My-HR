/*
  # Fix Leave Balance Calculations

  1. Changes
    - Adds function to calculate work days excluding weekends
    - Updates leave balance trigger to handle leave request status changes
    - Recalculates all existing leave balances
    
  2. Fixes
    - Ensures taken hours are calculated correctly
    - Updates balance hours based on accrued - taken
    - Handles date calculations properly
*/

-- Create function to calculate work days
CREATE OR REPLACE FUNCTION calculate_work_days(start_date date, end_date date)
RETURNS integer AS $$
DECLARE
  date_cursor date := start_date;
  work_days integer := 0;
BEGIN
  WHILE date_cursor <= end_date LOOP
    -- Count only weekdays (extract dow: 0=Sunday, 6=Saturday)
    IF extract(dow from date_cursor) NOT IN (0, 6) THEN
      work_days := work_days + 1;
    END IF;
    date_cursor := date_cursor + 1;
  END LOOP;
  
  RETURN work_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update leave balances
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  work_days integer;
  leave_hours numeric;
BEGIN
  -- Only process when status changes to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Calculate work days between start and end date
    work_days := calculate_work_days(NEW.start_date, NEW.end_date);
    leave_hours := work_days * 8; -- 8 hours per work day

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
  
  -- Handle rejection of previously approved leave
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    -- Calculate work days between start and end date
    work_days := calculate_work_days(OLD.start_date, OLD.end_date);
    leave_hours := work_days * 8;

    -- Restore leave balance
    UPDATE leave_balances
    SET 
      taken_hours = taken_hours - leave_hours,
      balance_hours = accrued_hours - (taken_hours - leave_hours),
      updated_at = now()
    WHERE 
      employee_id = OLD.employee_id
      AND leave_type = OLD.leave_type
      AND year_start <= OLD.start_date
      AND year_end >= OLD.end_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger
DROP TRIGGER IF EXISTS leave_balance_update_trigger ON leave_requests;
CREATE TRIGGER leave_balance_update_trigger
  AFTER UPDATE OF status ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance();

-- Recalculate all leave balances
DO $$
DECLARE
  r RECORD;
  work_days integer;
  leave_hours numeric;
BEGIN
  -- Reset all taken hours to 0
  UPDATE leave_balances 
  SET taken_hours = 0, 
      balance_hours = accrued_hours,
      updated_at = now();
  
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
    -- Calculate work days and leave hours
    work_days := calculate_work_days(r.start_date, r.end_date);
    leave_hours := work_days * 8;

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