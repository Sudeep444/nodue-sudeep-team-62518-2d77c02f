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

interface Student {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone: string;
  department: string;
  semester: number;
  section: string;
  batch: string;
  photo: string;
}

const ControlPanelStudents = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [batches, setBatches] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; student: Student | null }>({
    isOpen: false,
    student: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, semesterFilter, departmentFilter, batchFilter]);

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('name').order('name');
    if (data) {
      setBatches(data.map(b => b.name));
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      toast.error("Failed to fetch students");
      console.error(error);
    } else {
      setStudents(data || []);
    }
    setIsLoading(false);
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (semesterFilter !== "all") {
      filtered = filtered.filter((s) => s.semester?.toString() === semesterFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((s) => s.department === departmentFilter);
    }

    if (batchFilter !== "all") {
      filtered = filtered.filter((s) => s.batch === batchFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDialog.student) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-student', {
        body: { student_id: deleteDialog.student.id },
      });

      if (error) throw error;

      toast.success(`Student ${deleteDialog.student.name} deleted successfully`);
      setStudents(students.filter((s) => s.id !== deleteDialog.student?.id));
      setDeleteDialog({ isOpen: false, student: null });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete student");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={profile} title="Student Management" showNotifications={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin/control-panel">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Control Panel
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">View, filter, and manage student accounts</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, USN, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSemesterFilter("all");
                  setDepartmentFilter("all");
                  setBatchFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={student.photo} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{student.usn}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.department}</Badge>
                        </TableCell>
                        <TableCell>{student.semester}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>{student.batch}</TableCell>
                        <TableCell className="text-sm">{student.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/student/profile`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ isOpen: true, student })}
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
        onClose={() => setDeleteDialog({ isOpen: false, student: null })}
        onConfirm={handleDelete}
        title="Delete Student"
        description="Are you sure you want to delete this student?"
        entityName={deleteDialog.student?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ControlPanelStudents;
