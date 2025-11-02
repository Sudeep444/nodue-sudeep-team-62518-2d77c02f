-- Drop the existing foreign key to auth.users
ALTER TABLE public.applications
DROP CONSTRAINT applications_student_id_fkey;

-- Add new foreign key to public.profiles
ALTER TABLE public.applications
ADD CONSTRAINT applications_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;