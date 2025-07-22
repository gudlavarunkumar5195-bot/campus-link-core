
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Shield, Database, Bell, Mail } from 'lucide-react';

const SystemSettings = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'admin' && profile?.school_id === null;

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only super administrators can access system settings.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settingsCategories = [
    {
      title: 'Security Settings',
      description: 'Manage authentication, password policies, and security configurations',
      icon: Shield,
      items: [
        'Password complexity requirements',
        'Session timeout settings',
        'Two-factor authentication',
        'API rate limiting'
      ]
    },
    {
      title: 'Database Settings',
      description: 'Configure database connections and backup settings',
      icon: Database,
      items: [
        'Backup schedules',
        'Data retention policies',
        'Performance monitoring',
        'Query optimization'
      ]
    },
    {
      title: 'Notification Settings',
      description: 'Configure system-wide notification preferences',
      icon: Bell,
      items: [
        'Email notification templates',
        'SMS gateway configuration',
        'Push notification settings',
        'Alert thresholds'
      ]
    },
    {
      title: 'Email Configuration',
      description: 'Setup SMTP and email delivery settings',
      icon: Mail,
      items: [
        'SMTP server configuration',
        'Email templates',
        'Delivery tracking',
        'Bounce handling'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-blue-500" />
                    <span>{category.title}</span>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    disabled
                  >
                    Configure (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">System Version</p>
                <p className="text-gray-600">ERP v1.0.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Database Status</p>
                <p className="text-green-600">Connected</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Last Backup</p>
                <p className="text-gray-600">Today, 3:00 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
