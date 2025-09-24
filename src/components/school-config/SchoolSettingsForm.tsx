
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, Users, Upload, Bell, IdCard } from 'lucide-react';

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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['school-settings', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .eq('school_id', schoolId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SchoolSettings;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SchoolSettings>) => {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('school_settings')
          .update(updates)
          .eq('school_id', schoolId);
        
        if (error) throw error;
      } else {
        // Create new settings record
        const { error } = await supabase
          .from('school_settings')
          .insert({
            school_id: schoolId,
            ...updates
          });
        
        if (error) throw error;
      }
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
        title: "Exception",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (setting: keyof SchoolSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [setting]: value });
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const settingsConfig = [
    {
      key: 'bulk_upload_enabled' as keyof SchoolSettings,
      title: 'Bulk Upload',
      description: 'Allow uploading students, teachers, and staff via Excel files',
      icon: Upload,
      value: settings?.bulk_upload_enabled ?? true,
    },
    {
      key: 'student_registration_enabled' as keyof SchoolSettings,
      title: 'Student Registration',
      description: 'Allow new student registrations and admissions',
      icon: Users,
      value: settings?.student_registration_enabled ?? true,
    },
    {
      key: 'teacher_registration_enabled' as keyof SchoolSettings,
      title: 'Teacher Registration',
      description: 'Allow new teacher registrations and hiring',
      icon: Shield,
      value: settings?.teacher_registration_enabled ?? true,
    },
    {
      key: 'staff_registration_enabled' as keyof SchoolSettings,
      title: 'Staff Registration',
      description: 'Allow new staff registrations and hiring',
      icon: Users,
      value: settings?.staff_registration_enabled ?? true,
    },
    {
      key: 'auto_generate_ids' as keyof SchoolSettings,
      title: 'Auto Generate IDs',
      description: 'Automatically generate student/employee IDs',
      icon: IdCard,
      value: settings?.auto_generate_ids ?? true,
    },
    {
      key: 'email_notifications_enabled' as keyof SchoolSettings,
      title: 'Email Notifications',
      description: 'Send email notifications for important events',
      icon: Bell,
      value: settings?.email_notifications_enabled ?? true,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>School Feature Settings</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure which features are enabled for your school. Changes take effect immediately.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsConfig.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor={setting.key}
                      className="text-base font-medium cursor-pointer"
                    >
                      {setting.title}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={setting.key}
                  checked={setting.value}
                  onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Settings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {settingsConfig.map((setting) => (
              <div key={setting.key} className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    setting.value ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="text-sm font-medium text-blue-800">
                  {setting.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolSettingsForm;
