-- Function to ensure staff member has a specific role (idempotent)
CREATE OR REPLACE FUNCTION ensure_staff_has_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only insert if role doesn't exist (prevents duplicates)
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Trigger function to auto-assign counsellor role when faculty is selected as counsellor
CREATE OR REPLACE FUNCTION assign_counsellor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.counsellor_id IS NOT NULL THEN
    PERFORM ensure_staff_has_role(NEW.counsellor_id, 'counsellor'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on applications table for counsellor assignments
CREATE TRIGGER trg_assign_counsellor_role
AFTER INSERT OR UPDATE OF counsellor_id ON applications
FOR EACH ROW
WHEN (NEW.counsellor_id IS NOT NULL)
EXECUTE FUNCTION assign_counsellor_role();

-- Trigger function to auto-assign class advisor role when faculty is selected as class advisor
CREATE OR REPLACE FUNCTION assign_class_advisor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.class_advisor_id IS NOT NULL THEN
    PERFORM ensure_staff_has_role(NEW.class_advisor_id, 'class_advisor'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on applications table for class advisor assignments
CREATE TRIGGER trg_assign_class_advisor_role
AFTER INSERT OR UPDATE OF class_advisor_id ON applications
FOR EACH ROW
WHEN (NEW.class_advisor_id IS NOT NULL)
EXECUTE FUNCTION assign_class_advisor_role();

-- Backfill: Assign counsellor roles to faculty already assigned in existing applications
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT counsellor_id, 'counsellor'::app_role
FROM applications
WHERE counsellor_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Backfill: Assign class advisor roles to faculty already assigned in existing applications
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT class_advisor_id, 'class_advisor'::app_role
FROM applications
WHERE class_advisor_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;