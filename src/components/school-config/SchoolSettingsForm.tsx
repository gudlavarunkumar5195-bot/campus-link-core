
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

interface SchoolSettingsFormProps {
  schoolId: string;
}

interface SchoolSettings {
  id: string;
  school_id: string;
  bulk_upload_enabled: boolean;
  student_registration_enabled: boolean;
  teacher_registration_enabled: boolean;
  staff_registration_enabled: boolean;
  auto_generate_ids: boolean;
  email_notifications_enabled: boolean;
}

const SchoolSettingsForm: React.FC<SchoolSettingsFormProps> = ({ schoolId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['school-settings', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .eq('school_id', schoolId)
        .single();
      
      if (error) throw error;
      return data as SchoolSettings;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SchoolSettings>) => {
      const { error } = await supabase
        .from('school_settings')
        .update(updates)
        .eq('school_id', schoolId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['school-settings', schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (setting: keyof SchoolSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [setting]: value });
  };

  if (!settings) return <div>Loading settings...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>School Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bulk-upload">Bulk Upload</Label>
              <p className="text-sm text-muted-foreground">
                Allow uploading students, teachers, and staff via Excel files
              </p>
            </div>
            <Switch
              id="bulk-upload"
              checked={settings.bulk_upload_enabled}
              onCheckedChange={(checked) => handleSettingChange('bulk_upload_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="student-registration">Student Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new student registrations
              </p>
            </div>
            <Switch
              id="student-registration"
              checked={settings.student_registration_enabled}
              onCheckedChange={(checked) => handleSettingChange('student_registration_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="teacher-registration">Teacher Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new teacher registrations
              </p>
            </div>
            <Switch
              id="teacher-registration"
              checked={settings.teacher_registration_enabled}
              onCheckedChange={(checked) => handleSettingChange('teacher_registration_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="staff-registration">Staff Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new staff registrations
              </p>
            </div>
            <Switch
              id="staff-registration"
              checked={settings.staff_registration_enabled}
              onCheckedChange={(checked) => handleSettingChange('staff_registration_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-generate-ids">Auto Generate IDs</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate student/employee IDs
              </p>
            </div>
            <Switch
              id="auto-generate-ids"
              checked={settings.auto_generate_ids}
              onCheckedChange={(checked) => handleSettingChange('auto_generate_ids', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for important events
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications_enabled}
              onCheckedChange={(checked) => handleSettingChange('email_notifications_enabled', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolSettingsForm;
