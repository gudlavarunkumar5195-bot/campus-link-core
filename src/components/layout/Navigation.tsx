
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  UserCheck,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface NavigationProps {
  userRole: 'admin' | 'teacher' | 'student';
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ userRole, currentPage, onPageChange }) => {
  const { toast } = useToast();

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

  const getMenuItems = () => {
    const baseItems = [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

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
        <h1 className="text-xl font-bold text-gray-900">School ERP</h1>
        {profile && (
          <p className="text-sm text-gray-600 mt-1">
            {profile.first_name} {profile.last_name}
          </p>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {getMenuItems().map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Button
                  variant={currentPage === item.key ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onPageChange(item.key)}
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
