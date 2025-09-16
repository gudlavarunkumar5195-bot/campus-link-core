import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  School
} from 'lucide-react';
import IndiaFlagSection from '@/components/ui/india-flag-section';

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Student Management',
      description: 'Comprehensive student registration, tracking, and academic progress monitoring',
      color: 'text-blue-600'
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: 'Staff Management',
      description: 'Manage teachers, administrators, and support staff efficiently',
      color: 'text-green-600'
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Academic Planning',
      description: 'Course scheduling, curriculum management, and academic calendar',
      color: 'text-purple-600'
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with detailed reporting',
      color: 'text-orange-600'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Analytics & Reports',
      description: 'Comprehensive insights and performance analytics',
      color: 'text-red-600'
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: 'School Configuration',
      description: 'Customize settings, fee structures, and organizational preferences',
      color: 'text-teal-600'
    }
  ];

  const getDashboardPath = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case 'admin':
        return profile.school_id ? '/' : '/super-admin';
      case 'teacher':
      case 'student':
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen page-container animated-bg">
      {/* Hero Section */}
      <IndiaFlagSection
        title="School ERP System"
        subtitle="Empowering educational institutions with comprehensive management solutions designed for Indian schools"
        className="mb-16"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button 
            size="lg" 
            onClick={() => navigate(getDashboardPath())}
            className="bg-white/90 text-slate-800 hover:bg-white border border-white/50 shadow-lg"
          >
            <School className="mr-2 h-5 w-5" />
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {profile?.role === 'admin' && !profile.school_id && (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/create-school')}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              Create School
            </Button>
          )}
        </div>
      </IndiaFlagSection>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Welcome Message for Logged in Users */}
        {profile && (
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-white/80 text-slate-700">
              Welcome back, {profile.first_name}!
            </Badge>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {profile.role === 'admin' && !profile.school_id ? 'Super Administrator Portal' :
               profile.role === 'admin' ? 'School Administration Portal' :
               profile.role === 'teacher' ? 'Teacher Portal' :
               'Student Portal'}
            </h2>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="form-container border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="text-center">
                <div className={`${feature.color} mb-4 flex justify-center`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-slate-800">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="form-container border-white/50 shadow-lg max-w-2xl mx-auto">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Ready to Transform Your School Management?
              </h3>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Join thousands of educational institutions across India using our comprehensive ERP system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate(getDashboardPath())}
                  className="bg-gradient-to-r from-orange-500 to-green-500 text-white hover:from-orange-600 hover:to-green-600 shadow-lg"
                >
                  Access Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/analytics')}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  View System Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;