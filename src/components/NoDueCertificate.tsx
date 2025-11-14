import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Application {
  id: string;
  library_verified: boolean;
  library_comment?: string;
  hostel_verified: boolean;
  hostel_comment?: string;
  college_office_verified: boolean;
  college_office_comment?: string;
  faculty_verified: boolean;
  faculty_comment?: string;
  counsellor_verified: boolean;
  counsellor_comment?: string;
  class_advisor_verified: boolean;
  class_advisor_comment?: string;
  hod_verified: boolean;
  hod_comment?: string;
  payment_verified: boolean;
  payment_comment?: string;
  lab_verified: boolean;
  lab_comment?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  name: string;
  usn?: string;
  email?: string;
  department?: string;
  semester?: number;
  batch?: string;
  section?: string;
  student_type?: string;
}

interface NoDueCertificateProps {
  application: Application;
  profile: Profile;
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  } catch {
    return 'N/A';
  }
};

const formatDepartment = (dept?: string): string => {
  const deptMap: Record<string, string> = {
    'MECH': 'Mechanical Engineering',
    'CSE': 'Computer Science Engineering',
    'CIVIL': 'Civil Engineering',
    'EC': 'Electronics and Communication',
    'AIML': 'Artificial Intelligence & Machine Learning',
    'CD': 'Computer Science (Data Science)'
  };
  return dept ? deptMap[dept] || dept : 'N/A';
};

const ClearanceItem = ({ 
  name, 
  date, 
  comment 
}: { 
  name: string; 
  date: string; 
  comment?: string;
}) => (
  <div className="py-1.5">
    <div className="flex items-center gap-2 mb-1">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <span className="font-semibold text-foreground text-sm">{name}</span>
    </div>
    <div className="ml-6 text-xs text-muted-foreground">
      <div>Verified on: {date}</div>
      <div className="italic">Remarks: {comment || 'No remarks'}</div>
    </div>
  </div>
);

export const NoDueCertificate = ({ application, profile }: NoDueCertificateProps) => {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const isHostelStudent = profile.student_type === 'hostel';

  return (
    <Card className="max-w-4xl mx-auto print:shadow-none">
      <CardContent className="p-4 print:p-6">
        {/* Header */}
        <div className="text-center mb-4 pb-3 border-b-2 border-border">
          <h1 className="text-2xl font-bold text-foreground mb-1 uppercase tracking-wide">
            No Objection Certificate
          </h1>
          <h2 className="text-lg font-semibold text-muted-foreground">
            Clearance Certificate
          </h2>
        </div>

        {/* Intro */}
        <p className="text-center text-muted-foreground text-sm mb-4 leading-snug">
          This is to certify that the following student has successfully cleared all 
          requirements and has no pending dues or obligations with the institution.
        </p>

        {/* Student Details */}
        <div className="bg-muted/50 p-4 rounded-lg mb-4 border-l-4 border-primary">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">Name:</span>
              <span className="text-muted-foreground">{profile.name}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">USN:</span>
              <span className="text-muted-foreground">{profile.usn || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">Department:</span>
              <span className="text-muted-foreground">{formatDepartment(profile.department)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">Semester:</span>
              <span className="text-muted-foreground">{profile.semester || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">Batch:</span>
              <span className="text-muted-foreground">{profile.batch || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground">Section:</span>
              <span className="text-muted-foreground">{profile.section || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Clearance Details */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
            Clearance Details
          </h3>
          <Separator className="mb-2" />

          <div className="space-y-1">
            <ClearanceItem 
              name="Library Clearance"
              date={formatDate(application.updated_at)}
              comment={application.library_comment}
            />
            
            {isHostelStudent && (
              <ClearanceItem 
                name="Hostel Clearance"
                date={formatDate(application.updated_at)}
                comment={application.hostel_comment}
              />
            )}
            
            <ClearanceItem 
              name="College Office Clearance"
              date={formatDate(application.updated_at)}
              comment={application.college_office_comment}
            />
            
            <ClearanceItem 
              name="Faculty Clearance"
              date={formatDate(application.updated_at)}
              comment={application.faculty_comment}
            />
            
            <ClearanceItem 
              name="Counsellor Clearance"
              date={formatDate(application.updated_at)}
              comment={application.counsellor_comment}
            />
            
            <ClearanceItem 
              name="Class Advisor Clearance"
              date={formatDate(application.updated_at)}
              comment={application.class_advisor_comment}
            />
            
            <ClearanceItem 
              name="HOD Approval"
              date={formatDate(application.updated_at)}
              comment={application.hod_comment}
            />
            
            <div className="py-1.5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-foreground text-sm">Lab Charges Payment</span>
              </div>
              <div className="ml-6 text-xs text-muted-foreground">
                <div>Transaction ID: {application.transaction_id || 'N/A'}</div>
                <div>Verified on: {formatDate(application.updated_at)}</div>
                <div className="italic">Remarks: {application.payment_comment || 'No remarks'}</div>
              </div>
            </div>
            
            <ClearanceItem 
              name="Lab Instructor Clearance"
              date={formatDate(application.updated_at)}
              comment={application.lab_comment}
            />
          </div>
        </div>

        {/* Footer */}
        <Separator className="my-3" />
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Certificate Generated: {currentDate}
          </p>
          <p className="text-xs text-muted-foreground">
            Application ID: {application.id}
          </p>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            This certificate is valid and verifies that the student has no pending dues or obligations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
