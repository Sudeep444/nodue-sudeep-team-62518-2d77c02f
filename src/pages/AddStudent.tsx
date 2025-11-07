import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { studentSchema } from "@/utils/validation";
import { z } from 'zod';

interface StudentData {
  name: string;
  usn: string;
}

const AddStudent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [newStudent, setNewStudent] = useState({ name: '', usn: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingStudents, setExistingStudents] = useState<any[]>([]);

  const batches = ['2021-25', '2022-26', '2023-27', '2024-28'];
  const departments = ['MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD'];

  // Fetch existing students when batch and department are selected
  useEffect(() => {
    if (selectedBatch && selectedDepartment) {
      fetchExistingStudents();
    }
  }, [selectedBatch, selectedDepartment]);

  const fetchExistingStudents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('batch', selectedBatch)
        .eq('department', selectedDepartment as any);

      if (error) throw error;
      setExistingStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const addStudentToList = () => {
    if (!newStudent.name.trim() || !newStudent.usn.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and USN",
        variant: "destructive"
      });
      return;
    }

    // Validate student data
    try {
      studentSchema.parse(newStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    // Check for duplicate USN in the list
    if (students.some(s => s.usn === newStudent.usn)) {
      toast({
        title: "Error",
        description: "USN already exists in the list",
        variant: "destructive"
      });
      return;
    }

    setStudents([...students, { ...newStudent }]);
    setNewStudent({ name: '', usn: '' });
    toast({
      title: "Student Added",
      description: `${newStudent.name} added to the list`,
    });
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    if (students.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one student",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to create students
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-students`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            students: students.map(s => ({
              name: s.name,
              usn: s.usn,
              department: selectedDepartment,
              batch: selectedBatch
            }))
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create students');
      }

      // Show results
      if (result.success.length > 0) {
        toast({
          title: "Success!",
          description: `Added ${result.success.length} student(s) successfully`,
        });
      }

      if (result.errors.length > 0) {
        result.errors.forEach((err: any) => {
          toast({
            title: "Error",
            description: `${err.usn}: ${err.message}`,
            variant: "destructive"
          });
        });
      }

      // Reset and refresh
      setStudents([]);
      fetchExistingStudents();
    } catch (error: any) {
      console.error('Error adding students:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Add Student" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Multiple Students</h1>
            <p className="text-muted-foreground">Select batch → department → add students</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Selection and Input Panel */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Student Setup
                </CardTitle>
                <CardDescription>Select batch and department first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedBatch && selectedDepartment && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Add Students</CardTitle>
                  <CardDescription>
                    Login ID and Password will be auto-generated as USN
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <Input
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="Enter full name"
                      onKeyPress={(e) => e.key === 'Enter' && addStudentToList()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>USN (University Serial Number)</Label>
                    <Input
                      value={newStudent.usn}
                      onChange={(e) => setNewStudent({ ...newStudent, usn: e.target.value })}
                      placeholder="e.g., 21CS001"
                      onKeyPress={(e) => e.key === 'Enter' && addStudentToList()}
                    />
                  </div>

                  <Button onClick={addStudentToList} className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to List
                  </Button>

                  {students.length > 0 && (
                    <>
                      <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                        <h4 className="font-semibold text-sm">Students to Add ({students.length})</h4>
                        {students.map((student, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">USN: {student.usn}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStudent(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleSubmitAll} 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating Accounts...' : `Create ${students.length} Student Account(s)`}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Students List Panel */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Students in {selectedBatch} - {selectedDepartment}</CardTitle>
              <CardDescription>
                {selectedBatch && selectedDepartment 
                  ? `Showing students in batch ${selectedBatch}, department ${selectedDepartment}`
                  : 'Select batch and department to view students'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingStudents.length > 0 ? (
                      existingStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.usn}</TableCell>
                          <TableCell>
                            <Badge variant={student.profile_completed ? "default" : "outline"}>
                              {student.profile_completed ? 'Active' : 'Pending Setup'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          {selectedBatch && selectedDepartment 
                            ? 'No students found. Add students to get started.'
                            : 'Select batch and department to view students'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">📋 Login Credentials Information</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Login ID = USN (e.g., 21CS001)</li>
              <li>• Password = USN (same as Login ID)</li>
              <li>• Students must complete their profile on first login</li>
              <li>• Students can only access the system after being added by admin</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddStudent;
