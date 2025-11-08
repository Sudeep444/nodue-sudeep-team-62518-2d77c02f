-- Create enum type for verification status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Add verification_status column to application_subject_faculty table
ALTER TABLE application_subject_faculty 
ADD COLUMN verification_status verification_status DEFAULT 'pending';

-- Migrate existing data: set status based on faculty_verified boolean
UPDATE application_subject_faculty 
SET verification_status = CASE 
  WHEN faculty_verified = true THEN 'approved'::verification_status
  ELSE 'pending'::verification_status
END;

-- Add index for better query performance
CREATE INDEX idx_application_subject_faculty_status ON application_subject_faculty(verification_status);