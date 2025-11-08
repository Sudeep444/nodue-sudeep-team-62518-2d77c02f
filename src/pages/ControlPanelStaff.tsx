import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ArrowLeft, Search, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
  employee_id: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  is_active: boolean;
  photo: string;
  roles: string[];
}

const ControlPanelStaff = () => {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; staff: Staff | null }>({
    isOpen: false,
    staff: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, departmentFilter, roleFilter]);

  const fetchStaff = async () => {
    setIsLoading(true);
    
    // Get all staff profiles
    const { data: staffData, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('name');

    if (staffError) {
      toast.error("Failed to fetch staff");
      console.error(staffError);
      setIsLoading(false);
      return;
    }

    // Get user roles for staff
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['library', 'hostel', 'college_office', 'lab_instructor']);

    // Filter staff who have staff roles
    const staffIds = new Set(rolesData?.map(r => r.user_id) || []);
    const staffList = staffData?.filter(s => staffIds.has(s.id)).map(member => {
      const userRoles = rolesData?.filter(r => r.user_id === member.id).map(r => r.role) || [];
      return {
        ...member,
        roles: userRoles,
      };
    }) || [];

    setStaff(staffList);
    setIsLoading(false);
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((s) => s.department === departmentFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((s) => s.roles.includes(roleFilter));
    }

    setFilteredStaff(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.staff) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-staff', {
        body: { staff_id: deleteDialog.staff.id },
      });

      if (error) throw error;

      toast.success(`Staff ${deleteDialog.staff.name} deleted successfully`);
      setStaff(staff.filter((s) => s.id !== deleteDialog.staff?.id));
      setDeleteDialog({ isOpen: false, staff: null });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete staff");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      library: "bg-blue-500",
      hostel: "bg-green-500",
      college_office: "bg-purple-500",
      lab_instructor: "bg-orange-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      library: "Library",
      hostel: "Hostel",
      college_office: "College Office",
      lab_instructor: "Lab Instructor",
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={profile} title="Staff Management" showNotifications={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin/control-panel">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Control Panel
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Staff Management</h1>
          <p className="text-muted-foreground">View, filter, and manage staff accounts</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="MECH">Mechanical</SelectItem>
                  <SelectItem value="CSE">Computer Science</SelectItem>
                  <SelectItem value="CIVIL">Civil</SelectItem>
                  <SelectItem value="EC">Electronics</SelectItem>
                  <SelectItem value="AIML">AI & ML</SelectItem>
                  <SelectItem value="CD">Computer Science (CD)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="college_office">College Office</SelectItem>
                  <SelectItem value="lab_instructor">Lab Instructor</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("all");
                  setRoleFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredStaff.length} of {staff.length} staff members
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-muted-foreground">No staff found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.photo} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{member.employee_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.roles.map(role => (
                              <Badge key={role} className={`${getRoleBadgeColor(role)} text-white`}>
                                {getRoleLabel(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{member.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ isOpen: true, staff: member })}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, staff: null })}
        onConfirm={handleDelete}
        title="Delete Staff"
        description="Are you sure you want to delete this staff member?"
        entityName={deleteDialog.staff?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ControlPanelStaff;
