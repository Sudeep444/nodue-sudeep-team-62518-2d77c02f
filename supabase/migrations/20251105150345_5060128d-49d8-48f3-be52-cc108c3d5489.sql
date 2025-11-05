-- Create table to store which faculty members are assigned to which subjects for each application
CREATE TABLE IF NOT EXISTS public.application_subject_faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  faculty_verified BOOLEAN DEFAULT FALSE,
  faculty_comment TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id, subject_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_application_subject_faculty_application ON public.application_subject_faculty(application_id);
CREATE INDEX IF NOT EXISTS idx_application_subject_faculty_faculty ON public.application_subject_faculty(faculty_id);
CREATE INDEX IF NOT EXISTS idx_application_subject_faculty_verified ON public.application_subject_faculty(faculty_id, faculty_verified);

-- Enable RLS
ALTER TABLE public.application_subject_faculty ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own application's faculty assignments
CREATE POLICY "Students can view their application faculty assignments"
ON public.application_subject_faculty
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications
    WHERE applications.id = application_subject_faculty.application_id
    AND applications.student_id = auth.uid()
  )
);

-- Faculty can view assignments where they are the assigned faculty
CREATE POLICY "Faculty can view their assignments"
ON public.application_subject_faculty
FOR SELECT
USING (faculty_id = auth.uid());

-- Faculty can update their own assignments (verification status)
CREATE POLICY "Faculty can update their assignments"
ON public.application_subject_faculty
FOR UPDATE
USING (faculty_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all faculty assignments"
ON public.application_subject_faculty
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert (when applications are created)
CREATE POLICY "System can insert faculty assignments"
ON public.application_subject_faculty
FOR INSERT
WITH CHECK (true);

-- Support staff can view all assignments
CREATE POLICY "Support staff can view all assignments"
ON public.application_subject_faculty
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('library', 'hostel', 'lab_instructor', 'college_office')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_application_subject_faculty_updated_at
  BEFORE UPDATE ON public.application_subject_faculty
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();