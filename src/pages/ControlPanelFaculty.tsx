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

interface Faculty {
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

const ControlPanelFaculty = () => {
  const { profile } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; faculty: Faculty | null }>({
    isOpen: false,
    faculty: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    filterFaculty();
  }, [faculty, searchTerm, departmentFilter, designationFilter]);

  const fetchFaculty = async () => {
    setIsLoading(true);
    
    // Get all staff profiles
    const { data: staffData, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('name');

    if (staffError) {
      toast.error("Failed to fetch faculty");
      console.error(staffError);
      setIsLoading(false);
      return;
    }

    // Get user roles for faculty/hod
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['faculty', 'hod']);

    // Filter staff who have faculty or hod role
    const facultyIds = new Set(rolesData?.map(r => r.user_id) || []);
    const facultyList = staffData?.filter(s => facultyIds.has(s.id)).map(staff => {
      const userRoles = rolesData?.filter(r => r.user_id === staff.id).map(r => r.role) || [];
      return {
        ...staff,
        roles: userRoles,
      };
    }) || [];

    setFaculty(facultyList);
    setIsLoading(false);
  };

  const filterFaculty = () => {
    let filtered = faculty;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((f) => f.department === departmentFilter);
    }

    if (designationFilter !== "all") {
      filtered = filtered.filter((f) => f.designation === designationFilter);
    }

    setFilteredFaculty(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.faculty) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-faculty', {
        body: { faculty_id: deleteDialog.faculty.id },
      });

      if (error) throw error;

      toast.success(`Faculty ${deleteDialog.faculty.name} deleted successfully`);
      setFaculty(faculty.filter((f) => f.id !== deleteDialog.faculty?.id));
      setDeleteDialog({ isOpen: false, faculty: null });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete faculty");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={profile} title="Faculty Management" showNotifications={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin/control-panel">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Control Panel
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Faculty Management</h1>
          <p className="text-muted-foreground">View, filter, and manage faculty accounts</p>
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

              <Select value={designationFilter} onValueChange={setDesignationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("all");
                  setDesignationFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredFaculty.length} of {faculty.length} faculty members
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-muted-foreground">No faculty found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaculty.map((member) => (
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
                        <TableCell>{member.designation}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {member.roles.map(role => (
                              <Badge key={role} variant="secondary">
                                {role === 'hod' ? 'HOD' : 'Faculty'}
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
                              onClick={() => setDeleteDialog({ isOpen: true, faculty: member })}
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
        onClose={() => setDeleteDialog({ isOpen: false, faculty: null })}
        onConfirm={handleDelete}
        title="Delete Faculty"
        description="Are you sure you want to delete this faculty member? This will also remove all their subject assignments."
        entityName={deleteDialog.faculty?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ControlPanelFaculty;
