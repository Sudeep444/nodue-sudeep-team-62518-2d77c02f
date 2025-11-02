-- Add policy for students to fetch faculty details
CREATE POLICY "Students can fetch faculty details"
ON public.staff_profiles
FOR SELECT
TO authenticated
USING (
  designation IN ('HOD', 'Associate Professor', 'Assistant Professor')
  AND is_active = true
);