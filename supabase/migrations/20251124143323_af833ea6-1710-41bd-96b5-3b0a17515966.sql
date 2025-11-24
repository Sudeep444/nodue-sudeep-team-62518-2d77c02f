-- Create function to check if all faculty have verified an application
CREATE OR REPLACE FUNCTION public.check_all_faculty_verified()
RETURNS TRIGGER AS $$
DECLARE
  v_total_count INTEGER;
  v_verified_count INTEGER;
  v_all_verified BOOLEAN;
  v_any_rejected BOOLEAN;
BEGIN
  -- Count total and verified assignments for this application
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN faculty_verified = true THEN 1 END),
    bool_or(verification_status = 'rejected')
  INTO v_total_count, v_verified_count, v_any_rejected
  FROM application_subject_faculty
  WHERE application_id = NEW.application_id;
  
  -- All verified only if counts match and there's at least one assignment
  v_all_verified := (v_total_count = v_verified_count AND v_total_count > 0);
  
  -- Update application table
  UPDATE applications
  SET 
    faculty_verified = v_all_verified,
    status = CASE 
      WHEN v_any_rejected THEN 'rejected'
      WHEN v_all_verified THEN 'faculty_verified'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.application_id;
  
  -- Notify counsellor if all faculty verified
  IF v_all_verified THEN
    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT 
      a.counsellor_id,
      'Application Ready for Review',
      'Application from ' || p.name || ' (' || p.usn || ') has been verified by all faculty members and is ready for your review.',
      'info',
      'application',
      a.id
    FROM applications a
    JOIN profiles p ON p.id = a.student_id
    WHERE a.id = NEW.application_id
      AND a.counsellor_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE related_entity_id = a.id 
          AND user_id = a.counsellor_id 
          AND title = 'Application Ready for Review'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on application_subject_faculty
DROP TRIGGER IF EXISTS trigger_update_faculty_verified ON application_subject_faculty;
CREATE TRIGGER trigger_update_faculty_verified
AFTER INSERT OR UPDATE ON application_subject_faculty
FOR EACH ROW
EXECUTE FUNCTION public.check_all_faculty_verified();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_asf_application_verified 
ON application_subject_faculty(application_id, faculty_verified);

-- Data cleanup: Fix existing inconsistent faculty_verified statuses
UPDATE applications a
SET 
  faculty_verified = (
    SELECT COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN asf.faculty_verified = true THEN 1 END)
    FROM application_subject_faculty asf
    WHERE asf.application_id = a.id
  ),
  status = CASE
    WHEN EXISTS (
      SELECT 1 FROM application_subject_faculty asf
      WHERE asf.application_id = a.id AND asf.verification_status = 'rejected'
    ) THEN 'rejected'
    WHEN (
      SELECT COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN asf.faculty_verified = true THEN 1 END)
      FROM application_subject_faculty asf
      WHERE asf.application_id = a.id
    ) THEN 'faculty_verified'
    WHEN a.college_office_verified = true THEN 'college_office_verified'
    ELSE a.status
  END,
  updated_at = NOW()
WHERE a.college_office_verified = true
  AND a.status NOT IN ('rejected', 'completed', 'approved');