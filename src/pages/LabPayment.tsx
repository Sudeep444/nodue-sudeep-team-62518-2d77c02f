import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import { ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LabPayment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login/student");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');
      setProfile(profileData);
      setName(profileData.name || '');

      // Fetch current application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appError) throw appError;
      if (!appData) throw new Error('No application found');

      // Check if HOD has verified and payment is not yet done
      if (!appData.hod_verified) {
        toast.error('Payment can only be done after HOD verification');
        navigate('/dashboard/student');
        return;
      }

      if (appData.payment_verified) {
        toast.info('Payment already completed');
        navigate('/dashboard/student');
        return;
      }

      setApplication(appData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payment information');
      navigate('/dashboard/student');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionId.trim() || !name.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update application with transaction details
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          transaction_id: transactionId,
          payment_comment: `Payment submitted by ${name}`,
          status: 'payment_pending'
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Create notification for student
      await supabase.rpc('create_notification', {
        p_user_id: user?.id,
        p_title: 'Payment Details Submitted',
        p_message: 'Your lab charge payment details have been submitted for verification.',
        p_type: 'info',
        p_related_entity_type: 'application',
        p_related_entity_id: application.id
      });

      // Lab instructor notifications are now handled automatically by database trigger

      // Create audit log
      await supabase.rpc('create_audit_log', {
        p_action: 'payment_submitted',
        p_table_name: 'applications',
        p_record_id: application.id,
        p_metadata: {
          transaction_id: transactionId,
          student_name: name
        }
      });

      toast.success('Payment details submitted successfully!');
      navigate('/dashboard/student');
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <DashboardHeader 
        title="Lab Charge Payment"
        user={{
          name: profile.name,
          email: profile.email,
          role: 'student'
        }}
      />

      <div className="container mx-auto p-6 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/student')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Lab Charge Payment</CardTitle>
                <CardDescription>Submit your payment details for verification</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <Alert className="bg-success/10 border-success">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Your application has been approved by HOD. Please proceed with the lab charge payment.
              </AlertDescription>
            </Alert>

            {/* Payment Information */}
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Lab Charge Amount</h3>
                <p className="text-4xl font-bold text-primary mb-4">₹ 500</p>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-64 h-64 bg-white border-4 border-primary rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center p-4">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Scan QR Code to Pay
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      UPI ID: college@bank
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Scan the QR code above to make the payment of ₹500 using any UPI app
                </p>
              </div>
            </div>

            {/* Payment Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / UPI Reference Number *</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can find this in your UPI app payment history
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> Please ensure you have made the payment before submitting this form.
                  Your transaction details will be verified by the Lab Instructor.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Submit Payment Details
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                If you face any issues with the payment, please contact the administration office.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LabPayment;
