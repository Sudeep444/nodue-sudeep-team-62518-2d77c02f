import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, GraduationCap, Briefcase, ArrowLeft } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ControlPanel = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    staff: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Get total students
      const { count: students } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get faculty count (faculty + hod roles)
      const { data: facultyRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['faculty', 'hod']);

      // Get staff count (library, hostel, college_office, lab_instructor roles)
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['library', 'hostel', 'college_office', 'lab_instructor']);

      setStats({
        students: students || 0,
        faculty: facultyRoles?.length || 0,
        staff: staffRoles?.length || 0,
      });
    };

    fetchStats();
  }, []);

  const options = [
    {
      title: "Students",
      description: "View, filter, and manage student accounts",
      icon: GraduationCap,
      href: "/admin/control-panel/students",
      color: "from-blue-500 to-blue-600",
      count: stats.students,
    },
    {
      title: "Faculty",
      description: "View, filter, and manage faculty accounts",
      icon: Users,
      href: "/admin/control-panel/faculty",
      color: "from-green-500 to-green-600",
      count: stats.faculty,
    },
    {
      title: "Staff",
      description: "View, filter, and manage staff accounts",
      icon: Briefcase,
      href: "/admin/control-panel/staff",
      color: "from-purple-500 to-purple-600",
      count: stats.staff,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={profile} title="Control Panel" showNotifications={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Control Panel</h1>
          <p className="text-muted-foreground">
            Manage all users in the system with advanced filtering and deletion capabilities
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className={`h-16 w-16 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                  <option.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-foreground">{option.count}</div>
                  <Button asChild>
                    <Link to={option.href}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ControlPanel;
