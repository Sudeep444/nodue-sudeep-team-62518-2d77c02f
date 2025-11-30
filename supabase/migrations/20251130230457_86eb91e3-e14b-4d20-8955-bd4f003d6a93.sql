-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Faculty can view applications where assigned" ON public.applications;

-- Create a security definer function to check faculty assignment (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_assigned_faculty(_user_id uuid, _application_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.application_subject_faculty
    WHERE faculty_id = _user_id
    AND application_id = _application_id
  )
$$;

-- Create policy using the security definer function
CREATE POLICY "Faculty can view applications where assigned"
ON public.applications
FOR SELECT
USING (
  public.is_assigned_faculty(auth.uid(), id)
);