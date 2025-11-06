import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface PaymentDetailModalProps {
  application: any;
  open: boolean;
  onClose: () => void;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  processing: boolean;
}

export const PaymentDetailModal = ({
  application,
  open,
  onClose,
  onApprove,
  onReject,
  processing,
}: PaymentDetailModalProps) => {
  const [comment, setComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!application) return null;

  const handleApprove = () => {
    onApprove(comment);
    setComment("");
  };

  const handleReject = () => {
    if (!comment.trim()) {
      alert("Please provide a rejection comment");
      return;
    }
    onReject(comment);
    setComment("");
    setShowRejectForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Verification Details</DialogTitle>
          <DialogDescription>Review and verify lab charge payment</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div>
            <h3 className="font-semibold mb-3">Student Information</h3>
            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={application.profiles?.photo} alt={application.profiles?.name} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {application.profiles?.name}
                </div>
                <div>
                  <span className="font-medium">USN:</span> {application.profiles?.usn}
                </div>
                <div>
                  <span className="font-medium">Department:</span> {application.profiles?.department}
                </div>
                <div>
                  <span className="font-medium">Semester:</span> {application.semester}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {application.profiles?.email}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  <Badge variant="outline">{application.profiles?.student_type}</Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div>
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Submitted Name:</span>
                <span>{application.payment_comment?.replace('Payment submitted by ', '') || application.profiles?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Transaction ID:</span>
                <span className="font-mono font-semibold">{application.transaction_id || "Not submitted"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment Amount:</span>
                <span className="font-semibold">₹ 500</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Submission Date:</span>
                <span>{application.updated_at ? new Date(application.updated_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Verification Status */}
          <div>
            <h3 className="font-semibold mb-3">Verification Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Library Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Hostel/Local Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>College Office Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Faculty Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>HOD Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Payment Completed</span>
              </div>
            </div>
          </div>

          {/* Action Section */}
          {!application.lab_verified && application.status !== "completed" && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Actions</h3>

                {!showRejectForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add any notes about this verification..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleApprove} disabled={processing} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve & Issue Certificate
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectForm(true)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-destructive">
                        Rejection Comment (Required) *
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Provide reason for rejection..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleReject} disabled={processing} variant="destructive" className="flex-1">
                        Submit Rejection
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setComment("");
                        }}
                        disabled={processing}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
