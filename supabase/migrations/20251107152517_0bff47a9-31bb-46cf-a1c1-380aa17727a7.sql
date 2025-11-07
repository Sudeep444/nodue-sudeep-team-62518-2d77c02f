-- Function to notify lab instructors when payment is submitted
CREATE OR REPLACE FUNCTION notify_lab_instructors_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_lab_instructor RECORD;
BEGIN
  -- Only proceed if transaction_id was just added (payment submitted)
  IF NEW.transaction_id IS NOT NULL AND OLD.transaction_id IS NULL THEN
    
    -- Get student profile
    SELECT * INTO v_profile 
    FROM profiles 
    WHERE id = NEW.student_id;
    
    -- Create notifications for all lab instructors in the student's department
    FOR v_lab_instructor IN
      SELECT sp.id, sp.name
      FROM staff_profiles sp
      JOIN user_roles ur ON ur.user_id = sp.id
      WHERE sp.department = NEW.department
        AND sp.is_active = true
        AND ur.role = 'lab_instructor'
    LOOP
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id
      ) VALUES (
        v_lab_instructor.id,
        'New Payment Verification Request',
        format('%s (%s) from %s has submitted payment details for verification.', 
          v_profile.name, v_profile.usn, NEW.department),
        'info',
        'application',
        NEW.id
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_notify_lab_instructors_on_payment
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_lab_instructors_on_payment();