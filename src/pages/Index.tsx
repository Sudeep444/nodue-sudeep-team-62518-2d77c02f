import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Home, 
  Building2, 
  Users, 
  UserCog, 
  FlaskConical,
  UserRound,
  UserCheck
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    { 
      id: 'student', 
      title: 'Student', 
      icon: GraduationCap, 
      description: 'Submit and track No-Due applications',
      color: 'bg-primary'
    },
    { 
      id: 'admin', 
      title: 'Admin', 
      icon: UserCog, 
      description: 'Manage users and system settings',
      color: 'bg-purple-600'
    },
    { 
      id: 'library', 
      title: 'Library', 
      icon: BookOpen, 
      description: 'Verify library clearance',
      color: 'bg-blue-600'
    },
    { 
      id: 'hostel', 
      title: 'Hostel', 
      icon: Home, 
      description: 'Verify hostel clearance',
      color: 'bg-green-600'
    },
    { 
      id: 'college_office', 
      title: 'College Office', 
      icon: Building2, 
      description: 'Verify college office clearance',
      color: 'bg-orange-600'
    },
    { 
      id: 'faculty', 
      title: 'Faculty', 
      icon: Users, 
      description: 'Verify subject clearance',
      color: 'bg-indigo-600'
    },
    { 
      id: 'hod', 
      title: 'HOD', 
      icon: User, 
      description: 'Department head verification',
      color: 'bg-red-600'
    },
    { 
      id: 'lab_instructor', 
      title: 'Lab Instructor', 
      icon: FlaskConical, 
      description: 'Verify lab charge payment',
      color: 'bg-teal-600'
    },
    { 
      id: 'counsellor', 
      title: 'Student Counsellor', 
      icon: UserRound, 
      description: 'Provide student guidance and support',
      color: 'bg-pink-600'
    },
    { 
      id: 'class_advisor', 
      title: 'Class Advisor', 
      icon: UserCheck, 
      description: 'Supervise and mentor class activities',
      color: 'bg-amber-600'
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-3 rounded-xl shadow-lg">
                  <GraduationCap className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Nodex
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Digital No-Due System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto mb-20 animate-fade-in">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              Seamless Digital Processing
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Welcome to the Future of
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mt-2">
              No-Due Certification
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Streamlined verification system that connects students, faculty, and administration for efficient clearance processing
          </p>
        </div>

        {/* Role Selection Section */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Select Your Portal
            </h3>
            <p className="text-muted-foreground">
              Choose your role to access your personalized dashboard
            </p>
          </div>

          {/* Primary Roles - Larger Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {roles.slice(0, 3).map((role, index) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/50 animate-fade-in hover-scale"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/login/${role.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="relative p-8">
                    <div className="flex flex-col items-center text-center space-y-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                        <div className={`relative ${role.color} text-white p-5 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                          <Icon className="h-10 w-10" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {role.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                      <Button 
                        className="w-full mt-4 group-hover:bg-primary group-hover:shadow-lg transition-all duration-300"
                        variant="outline"
                      >
                        Access Portal
                        <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Secondary Roles - Compact Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {roles.slice(3).map((role, index) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary/50 animate-fade-in"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  onClick={() => navigate(`/login/${role.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`${role.color} text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {role.title}
                      </h4>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-20 mt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background -mx-4"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Everyone
            </h3>
            <p className="text-muted-foreground text-lg">
              Experience seamless clearance processing with our comprehensive suite of tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-card rounded-2xl p-8 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative">
                <div className="bg-success/10 text-success p-5 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-3 text-foreground">Multi-Step Verification</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Comprehensive approval workflow across all departments ensuring thorough clearance processing
                </p>
              </div>
            </div>

            <div className="group relative bg-card rounded-2xl p-8 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative">
                <div className="bg-warning/10 text-warning p-5 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-3 text-foreground">Real-Time Notifications</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Stay informed with instant updates on application status changes and pending actions
                </p>
              </div>
            </div>

            <div className="group relative bg-card rounded-2xl p-8 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative">
                <div className="bg-primary/10 text-primary p-5 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold mb-3 text-foreground">Digital Certificates</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Download verified No-Due certificates instantly upon completion of all clearances
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t mt-20 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-foreground">Nodex</span>
            </div>
            <p className="text-center text-muted-foreground">
              Digital No-Due Certificate System
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Nodex. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
