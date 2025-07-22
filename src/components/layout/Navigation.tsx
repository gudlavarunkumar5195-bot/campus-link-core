
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Building2,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  userRole: 'admin' | 'teacher' | 'student';
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ userRole, currentPage, onPageChange }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: school } = useQuery({
    queryKey: ['school', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return null;
      
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    }
  };

  const isSuperAdmin = profile?.role === 'admin' && profile?.school_id === null;

  const handlePageChange = (page: string) => {
    if (page === 'schools') {
      navigate('/schools');
    } else if (page === 'create-school') {
      navigate('/create-school');
    } else if (page === 'users' && isSuperAdmin) {
      navigate('/users');
    } else if (page === 'settings' && isSuperAdmin) {
      navigate('/settings');
    } else {
      onPageChange(page);
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (isSuperAdmin) {
      return [
        ...baseItems,
        { key: 'schools', label: 'Schools', icon: Building2 },
        { key: 'create-school', label: 'Create School', icon: Plus },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    if (userRole === 'admin') {
      return [
        ...baseItems,
        { key: 'users', label: 'Users', icon: Users },
        { key: 'classes', label: 'Classes', icon: BookOpen },
        { key: 'subjects', label: 'Subjects', icon: GraduationCap },
        { key: 'timetable', label: 'Timetable', icon: Calendar },
        { key: 'attendance', label: 'Attendance', icon: UserCheck },
        { key: 'grades', label: 'Grades', icon: FileText },
        { key: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    if (userRole === 'teacher') {
      return [
        ...baseItems,
        { key: 'classes', label: 'My Classes', icon: BookOpen },
        { key: 'timetable', label: 'Timetable', icon: Calendar },
        { key: 'attendance', label: 'Attendance', icon: UserCheck },
        { key: 'grades', label: 'Grades', icon: FileText },
        { key: 'assignments', label: 'Assignments', icon: FileText },
      ];
    }

    return [
      ...baseItems,
      { key: 'timetable', label: 'Timetable', icon: Calendar },
      { key: 'attendance', label: 'My Attendance', icon: UserCheck },
      { key: 'grades', label: 'My Grades', icon: FileText },
      { key: 'assignments', label: 'Assignments', icon: FileText },
    ];
  };

  return (
    <div className="bg-white shadow-sm border-r h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3 mb-3">
          {school?.logo_url ? (
            <img 
              src={school.logo_url} 
              alt={`${school.name} logo`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {school?.name || 'School ERP'}
            </h1>
            {isSuperAdmin && (
              <Badge variant="secondary" className="text-xs">
                Super Admin
              </Badge>
            )}
          </div>
        </div>
        {profile && (
          <div className="text-sm text-gray-600">
            <p className="font-medium">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs capitalize">{profile.role}</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {getMenuItems().map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key || 
              (item.key === 'schools' && window.location.pathname === '/schools') ||
              (item.key === 'create-school' && window.location.pathname === '/create-school') ||
              (item.key === 'users' && window.location.pathname === '/users') ||
              (item.key === 'settings' && window.location.pathname === '/settings');
            
            return (
              <li key={item.key}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handlePageChange(item.key)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Navigation;
