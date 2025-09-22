import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Settings, Users, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SettingCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  check: () => Promise<boolean>;
}

const SettingsWizard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [checkedSettings, setCheckedSettings] = useState<{[key: string]: boolean}>({});

  const settingsChecks: SettingCheck[] = [
    {
      id: 'class_structure',
      name: 'Class Structure',
      description: 'Set up classes and sections for your school',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/classes',
      check: async () => {
        const { data } = await supabase
          .from('class_structure')
          .select('id')
          .eq('school_id', profile?.school_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
    },
    {
      id: 'academic_year',
      name: 'Academic Year',
      description: 'Configure the current academic year settings',
      icon: <Calendar className="h-5 w-5" />,
      path: '/academic-year',
      check: async () => {
        const { data } = await supabase
          .from('academic_years')
          .select('id')
          .eq('school_id', profile?.school_id)
          .eq('is_active', true)
          .limit(1);
        return (data?.length || 0) > 0;
      }
    },
    {
      id: 'subjects',
      name: 'Subjects',
      description: 'Add subjects offered by your school',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/system-settings',
      check: async () => {
        const { data } = await supabase
          .from('subjects_offered')
          .select('id')
          .eq('school_id', profile?.school_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
    },
    {
      id: 'fee_structure',
      name: 'Fee Structure',
      description: 'Set up fee categories and amounts',
      icon: <DollarSign className="h-5 w-5" />,
      path: '/fee-management',
      check: async () => {
        const { data } = await supabase
          .from('fee_structures')
          .select('id')
          .eq('school_id', profile?.school_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
    },
    {
      id: 'teachers',
      name: 'Teachers',
      description: 'Add teachers to your school',
      icon: <Users className="h-5 w-5" />,
      path: '/add-teacher',
      check: async () => {
        const { data } = await supabase
          .from('teachers')
          .select(`
            id,
            profiles!teachers_profile_id_fkey(school_id)
          `)
          .eq('profiles.school_id', profile?.school_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
    }
  ];

  // Check all settings
  const { data: settingsStatus, isLoading } = useQuery({
    queryKey: ['settings_status', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return {};
      
      const results: {[key: string]: boolean} = {};
      for (const setting of settingsChecks) {
        try {
          results[setting.id] = await setting.check();
        } catch (error) {
          console.error(`Error checking ${setting.id}:`, error);
          results[setting.id] = false;
        }
      }
      return results;
    },
    enabled: !!profile?.school_id
  });

  const completedCount = Object.values(settingsStatus || {}).filter(Boolean).length;
  const totalCount = settingsChecks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (profile?.role !== 'admin') {
    return (
      <Card className="form-container border-white/50 shadow-lg">
        <CardContent className="text-center py-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can access settings wizard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="form-container border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            School Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">Setup Completion</span>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="glass-effect">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {completionPercentage === 100 
                ? "🎉 Congratulations! Your school setup is complete." 
                : "Complete the remaining steps to finish your school setup."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Checklist */}
      <Card className="form-container border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {settingsChecks.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/20 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                    <div>
                      <div className="w-32 h-4 bg-white/20 rounded mb-2"></div>
                      <div className="w-48 h-3 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {settingsChecks.map((setting) => {
                const isCompleted = settingsStatus?.[setting.id] || false;
                return (
                  <div key={setting.id} className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/20 hover:border-white/40 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-muted-foreground">
                          {setting.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{setting.name}</p>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCompleted ? (
                        <Badge variant="default" className="glass-effect">
                          Completed
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(setting.path)}
                          className="glass-effect"
                        >
                          Set Up
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {completionPercentage < 100 && (
        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                To get the most out of your school ERP system:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Complete the class structure setup first</li>
                <li>Configure the current academic year</li>
                <li>Add subjects and fee structure</li>
                <li>Add teachers and assign them to classes</li>
                <li>Start adding students to your system</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsWizard;