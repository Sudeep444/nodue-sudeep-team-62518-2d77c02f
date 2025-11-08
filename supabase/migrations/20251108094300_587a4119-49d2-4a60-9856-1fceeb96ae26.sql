-- Allow students and authenticated users to view basic staff profile information
CREATE POLICY "Students can view active staff profiles"
ON public.staff_profiles
FOR SELECT
TO authenticated
USING (is_active = true);