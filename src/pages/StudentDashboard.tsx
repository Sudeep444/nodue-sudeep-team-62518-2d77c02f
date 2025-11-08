import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Edit,
  CreditCard,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DashboardHeader from "@/components/DashboardHeader";
import { useNotifications } from "@/hooks/useNotifications";
import { generateCertificateHTML } from "@/utils/certificateGenerator";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  usn: string;
  phone: string;
  department: string;
  section: string;
  semester: number;
  student_type: string;
  batch: string;
  photo?: string;
  profile_completed: boolean;
}

interface Application {
  id: string;
  student_id: string;
  department: string;
  semester: number;
  batch: string;
  status: string;
  library_verified: boolean;
  hostel_verified: boolean;
  college_office_verified: boolean;
  faculty_verified: boolean;
  hod_verified: boolean;
  payment_verified: boolean;
  lab_verified: boolean;
  created_at: string;
  updated_at: string;
  library_comment?: string;
  hostel_comment?: string;
  college_office_comment?: string;
  faculty_comment?: string;
  hod_comment?: string;
  payment_comment?: string;
  lab_comment?: string;
  transaction_id?: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionsAllowed, setSubmissionsAllowed] = useState(true);
  const [submissionMessage, setSubmissionMessage] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate("/login/student");
      return;
    }

    fetchStudentData();
  }, [user, navigate]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if profile is completed
      if (!profileData.profile_completed) {
        navigate('/student/complete-profile');
        return;
      }

      setProfile(profileData);

      // Check submission status
      await checkSubmissionStatus(profileData.batch);

      // Fetch student applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      setApplications(applicationsData || []);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubmissionStatus = async (batchName: string) => {
    try {
      // Check batch-specific settings first
      const { data: batchSetting } = await supabase
        .from('batch_submission_settings')
        .select('*')
        .eq('batch_name', batchName)
        .maybeSingle();

      const now = new Date();
      let settings = batchSetting;

      // If no batch-specific settings, use global
      if (!settings) {
        const { data: globalSetting } = await supabase
          .from('global_submission_settings')
          .select('*')
          .maybeSingle();
        settings = globalSetting;
      }

      if (!settings) {
        setSubmissionsAllowed(true);
        return;
      }

      // Check enabled flag
      if (!settings.enabled) {
        setSubmissionsAllowed(false);
        setSubmissionMessage('Submissions are currently disabled by administration');
        return;
      }

      // Check schedule
      if (settings.scheduled_start) {
        const start = new Date(settings.scheduled_start);
        if (now < start) {
          setSubmissionsAllowed(false);
          setSubmissionMessage(`Submissions will open on ${start.toLocaleString()}`);
          return;
        }
      }

      if (settings.scheduled_end) {
        const end = new Date(settings.scheduled_end);
        if (now > end) {
          setSubmissionsAllowed(false);
          setSubmissionMessage('Submission window has closed');
          return;
        }
      }

      setSubmissionsAllowed(true);
    } catch (error) {
      console.error('Error checking submission status:', error);
      setSubmissionsAllowed(true); // Default to allowing on error
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCertificateDownload = () => {
    if (!currentApplication || !profile) {
      toast.error("Certificate data not available");
      return;
    }
    
    const certificateWindow = window.open('', '_blank', 'width=800,height=600');
    if (!certificateWindow) {
      toast.error('Please allow pop-ups to download certificate');
      return;
    }
    
    try {
      const certificateHTML = generateCertificateHTML(currentApplication, profile);
      certificateWindow.document.write(certificateHTML);
      certificateWindow.document.close();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        certificateWindow.print();
      }, 250);
      
      toast.success("Certificate opened. Use Print dialog to save as PDF");
    } catch (error) {
      console.error("Error generating certificate:", error);
      certificateWindow.close();
      toast.error("Failed to generate certificate");
    }
  };

  const calculateProgress = (app: Application) => {
    const steps = [
      app.library_verified,
      profile?.student_type === 'hostel' ? app.hostel_verified : true,
      app.college_office_verified,
      app.faculty_verified,
      app.hod_verified,
      app.payment_verified,
      app.lab_verified
    ];
    const completed = steps.filter(Boolean).length;
    return (completed / steps.length) * 100;
  };

  const activeApplications = applications.filter(app => app.status !== 'completed' && app.status !== 'rejected');
  const completedApplications = applications.filter(app => app.status === 'completed');
  const currentApplication = applications[0];

  const stats = [
    {
      title: "Active Applications",
      value: activeApplications.length.toString(),
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Pending Approvals",
      value: currentApplication ? 
        [
          !currentApplication.library_verified,
          !currentApplication.hostel_verified && profile?.student_type === 'hostel',
          !currentApplication.college_office_verified,
          !currentApplication.faculty_verified,
          !currentApplication.hod_verified,
          !currentApplication.payment_verified,
          !currentApplication.lab_verified
        ].filter(Boolean).length.toString() : "0",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Completed",
      value: completedApplications.length.toString(),
      icon: CheckCircle2,
      color: "text-success"
    }
  ];

  const verificationSteps = currentApplication ? [
    { 
      name: "Library", 
      verified: currentApplication.library_verified, 
      required: true,
      comment: currentApplication.library_comment 
    },
    { 
      name: "Hostel", 
      verified: currentApplication.hostel_verified, 
      required: profile?.student_type === 'hostel',
      comment: currentApplication.hostel_comment 
    },
    { 
      name: "College Office", 
      verified: currentApplication.college_office_verified, 
      required: true,
      comment: currentApplication.college_office_comment 
    },
    { 
      name: "Faculty", 
      verified: currentApplication.faculty_verified, 
      required: true,
      comment: currentApplication.faculty_comment 
    },
    { 
      name: "HOD", 
      verified: currentApplication.hod_verified, 
      required: true,
      comment: currentApplication.hod_comment 
    },
    { 
      name: "Lab Charge Payment", 
      verified: currentApplication.payment_verified, 
      required: true,
      comment: currentApplication.payment_comment 
    },
    { 
      name: "Lab Instructor", 
      verified: currentApplication.lab_verified, 
      required: true,
      comment: currentApplication.lab_comment 
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center mb-4">Profile not found</p>
            <Button onClick={() => navigate('/student/complete-profile')} className="w-full">
              Complete Your Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <DashboardHeader 
        title="Student Dashboard"
        user={{
          name: profile.name,
          email: profile.email,
          role: 'student'
        }}
      />

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Summary Card */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-primary/10 to-secondary/10 animate-fade-in">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-primary/30 shadow-lg transition-transform group-hover:scale-105">
                  {profile.photo ? (
                    <AvatarImage src={profile.photo} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10 group-hover:bg-primary/20 transition-colors" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome, {profile.name}!
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="text-xl font-semibold text-foreground">{profile.usn}</p>
                  <p className="text-base">
                    <span className="font-medium text-foreground">{profile.department}</span> - Section {profile.section} • Semester {profile.semester}
                  </p>
                  <p className="text-sm">{profile.email}</p>
                  <p className="text-sm">
                    <span className="capitalize font-medium text-foreground">{profile.student_type}</span> Student • Batch {profile.batch}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => navigate('/student/profile')} variant="outline" size="sm" className="hover-scale">
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
                <Button onClick={() => navigate('/student/edit-profile')} variant="default" size="sm" className="hover-scale">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="group hover:shadow-xl transition-all duration-300 border-none shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                      <p className="text-5xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`h-16 w-16 rounded-2xl ${stat.color} bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submission Not Available Alert */}
        {!submissionsAllowed && (
          <Card className="border-warning/50 bg-gradient-to-r from-warning/10 to-warning/5 shadow-lg animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2 text-warning">Submissions Not Available</h4>
                  <p className="text-sm text-foreground/80">
                    {submissionMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            size="lg" 
            className="h-28 text-lg font-semibold shadow-lg hover:shadow-xl transition-all group hover-scale"
            onClick={() => navigate('/student/submit-form')}
            disabled={!submissionsAllowed}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
              <span>Submit No-Due Application</span>
            </div>
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-28 text-lg font-semibold shadow-lg hover:shadow-xl transition-all group hover-scale border-2"
            disabled={!currentApplication || !currentApplication.hod_verified || currentApplication.payment_verified}
            onClick={() => navigate('/student/lab-payment')}
          >
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-7 w-7 group-hover:scale-110 transition-transform" />
              <span>Lab Charge Payment</span>
            </div>
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="h-28 text-lg font-semibold shadow-lg hover:shadow-xl transition-all group hover-scale border-2"
            disabled={!currentApplication || !currentApplication.lab_verified}
            onClick={handleCertificateDownload}
          >
            <div className="flex flex-col items-center gap-2">
              <Download className="h-7 w-7 group-hover:translate-y-1 transition-transform" />
              <span>Download Certificate</span>
            </div>
          </Button>
        </div>

        {/* Current Application Status */}
        {currentApplication && (
          <Card className="shadow-xl border-none bg-gradient-to-br from-card to-card/80 animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Current Application Status</CardTitle>
                  <CardDescription className="text-base mt-1">Track your No-Due application progress</CardDescription>
                </div>
                <StatusBadge status={currentApplication.status as any} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Submitted {new Date(currentApplication.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {Math.round(calculateProgress(currentApplication))}%
                  </span>
                </div>
                <Progress value={calculateProgress(currentApplication)} className="h-3 shadow-inner" />
              </div>

              {/* Verification Steps */}
              <div className="space-y-3">
                {verificationSteps.map((step, index) => {
                  if (!step.required) return null;
                  
                  return (
                    <div 
                      key={step.name} 
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        step.verified 
                          ? 'bg-gradient-to-r from-success/5 to-success/10 border-success/30' 
                          : 'bg-muted/30 border-muted-foreground/20'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        step.verified 
                          ? 'bg-success/20 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.verified ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-base mb-1">
                          {step.name} Verification
                        </p>
                        {step.verified ? (
                          <p className="text-sm text-success font-semibold">✓ Verified</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Awaiting verification</p>
                        )}
                        {step.comment && (
                          <div className="mt-3 p-3 bg-background/60 rounded-lg border">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Comment:</p>
                            <p className="text-sm text-foreground">{step.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Reminder */}
              {currentApplication.hod_verified && !currentApplication.payment_verified && (
                <div className="p-5 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl border-2 border-warning/50 shadow-lg animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-warning text-lg mb-2">Lab Charge Payment Required</h4>
                      <p className="text-sm text-foreground/90 mb-4">
                        Your application has been approved by the HOD. Please proceed with the lab charge payment to continue.
                      </p>
                      <Button 
                        className="hover-scale shadow-md" 
                        onClick={() => navigate('/student/lab-payment')}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Submit Payment Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Active Application */}
        {!currentApplication && (
          <Card className="border-2 border-dashed border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 animate-fade-in">
            <CardContent className="pt-6 text-center py-16">
              <div className="relative inline-block mb-6">
                <FileText className="h-20 w-20 text-primary/40" />
                <div className="absolute inset-0 blur-xl bg-primary/20 -z-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Active Application</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't submitted a No-Due application yet. Get started by submitting your first application.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/student/submit-form')}
                className="hover-scale shadow-lg"
                disabled={!submissionsAllowed}
              >
                <Plus className="h-5 w-5 mr-2" />
                Submit Your First Application
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Notifications */}
        <Card className="shadow-xl border-none animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                Recent Notifications
                {unreadCount > 0 && (
                  <span className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </CardTitle>
              <Button variant="link" onClick={() => navigate('/student/notifications')} className="text-primary hover:text-primary/80">
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification, index) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                      !notification.read 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-muted-foreground/20'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      notification.type === 'approval' ? 'bg-success/20 text-success' :
                      notification.type === 'rejection' ? 'bg-destructive/20 text-destructive' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {notification.type === 'approval' ? <CheckCircle2 className="h-6 w-6" /> :
                       notification.type === 'rejection' ? <AlertCircle className="h-6 w-6" /> :
                       <Bell className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base mb-1">{notification.title}</p>
                      <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative inline-block mb-4">
                  <Bell className="h-16 w-16 text-muted-foreground/40" />
                  <div className="absolute inset-0 blur-xl bg-muted-foreground/10 -z-10" />
                </div>
                <p className="text-muted-foreground text-lg">No notifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
