import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Copy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const AddStaff = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Navigation state
  const [selectedRole, setSelectedRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    phone: '',
    officeLocation: '',
    dateOfJoining: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedStaff, setAddedStaff] = useState<any[]>([]);

  // Fetch existing staff from database
  useEffect(() => {
    fetchStaff();

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel('staff_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_profiles'
        },
        () => {
          fetchStaff();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStaff = async () => {
    const { data: staffData, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return;
    }
    
    if (staffData && staffData.length > 0) {
      // Fetch roles for all staff
      const staffIds = staffData.map((s: any) => s.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', staffIds);
      
      // Map roles to staff
      const rolesMap = new Map(rolesData?.map((r: any) => [r.user_id, r.role]) || []);
      
      setAddedStaff(staffData.map((staff: any) => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        empId: staff.employee_id,
        role: rolesMap.get(staff.id) || 'unknown',
        status: staff.is_active ? 'active' : 'inactive'
      })));
    }
  };

  const getRoleMapping = (role: string) => {
    const mappings: { [key: string]: string } = {
      'library': 'library',
      'hostel': 'hostel',
      'office': 'college_office',
      'lab': 'lab_instructor'
    };
    return mappings[role] || role;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleNext = () => {
    if (selectedRole) {
      setShowForm(true);
    }
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      setSelectedRole('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate email format
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (!formData.empId.trim()) {
        throw new Error('Employee ID is required');
      }

      // Create staff via secure backend function (preserves admin session)
      const mappedRole = getRoleMapping(selectedRole);
      const { data: result, error: fnError } = await (supabase as any).functions.invoke('create-staff', {
        body: {
          name: formData.name,
          email: formData.email,
          employee_id: formData.empId,
          phone: formData.phone || null,
          office_location: formData.officeLocation || null,
          date_of_joining: formData.dateOfJoining || null,
          designation: getRoleDisplayName(selectedRole),
          role: mappedRole,
        }
      });

      if (fnError) {
        if ((fnError as any).message?.includes('already registered')) {
          throw new Error('An account with this email already exists');
        }
        throw new Error((fnError as any).message || 'Failed to create staff account');
      }

      toast({
        title: "Success!",
        description: `Staff account created. Email: ${formData.email} | Password: ${formData.empId}`,
      });

      // Refresh staff list and reset form
      await fetchStaff();
      setFormData({ name: '', email: '', empId: '', phone: '', officeLocation: '', dateOfJoining: '' });
      setShowForm(false);
      setSelectedRole('');

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff account",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'library': 'Library Staff',
      'hostel': 'Hostel Staff',
      'office': 'Office Staff',
      'lab': 'Lab Instructor',
      'hod': 'HOD'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Add Staff" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Staff</h1>
            <p className="text-muted-foreground">Create staff accounts with generated login credentials</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <span className={selectedRole ? "text-foreground font-medium" : ""}>
            {selectedRole ? getRoleDisplayName(selectedRole) : "Select Role"}
          </span>
          {showForm && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Add Staff</span>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {!showForm ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Staff Setup
                </CardTitle>
                <CardDescription>
                  Select staff role to proceed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedRole ? (
                  <div className="space-y-2">
                    <Label>Select Staff Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="library">Library</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="office">College Office</SelectItem>
                        <SelectItem value="lab">Lab Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Selected Role:</h4>
                      <p>{getRoleDisplayName(selectedRole)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleBack} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button onClick={handleNext} className="flex-1">
                        Proceed to Add Staff
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Staff Information
                </CardTitle>
                <CardDescription>
                  Enter staff details and generate login credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="staff@nodex.edu"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empId">Employee ID</Label>
                    <Input
                      id="empId"
                      value={formData.empId}
                      onChange={(e) => setFormData({...formData, empId: e.target.value})}
                      placeholder="Enter employee ID"
                      required
                    />
                    <p className="text-xs text-muted-foreground">This will be used as the login password</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="10-digit phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officeLocation">Office Location (Optional)</Label>
                    <Input
                      id="officeLocation"
                      value={formData.officeLocation}
                      onChange={(e) => setFormData({...formData, officeLocation: e.target.value})}
                      placeholder="e.g., Room 301, Block A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfJoining">Date of Joining (Optional)</Label>
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1" disabled={isSubmitting}>
                      Back to Setup
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Account...' : 'Create Staff Account'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Staff Panel */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Staff Panel</CardTitle>
              <CardDescription>
                {selectedRole 
                  ? `${getRoleDisplayName(selectedRole)} Staff`
                  : 'Select role to view staff'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addedStaff
                    .filter(staffMember => !selectedRole || staffMember.role === selectedRole || staffMember.role === getRoleMapping(selectedRole))
                    .map((staffMember) => (
                    <TableRow key={staffMember.id}>
                      <TableCell className="font-medium">{staffMember.name}</TableCell>
                      <TableCell className="font-mono text-sm">{staffMember.email}</TableCell>
                      <TableCell>{staffMember.empId}</TableCell>
                      <TableCell>{getRoleDisplayName(staffMember.role)}</TableCell>
                      <TableCell>
                        <Badge variant={staffMember.status === 'active' ? 'default' : 'secondary'}>
                          {staffMember.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {addedStaff.filter(s => !selectedRole || s.role === selectedRole || s.role === getRoleMapping(selectedRole)).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AddStaff;
