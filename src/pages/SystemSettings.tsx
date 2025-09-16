import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Database, Shield, Bell, Palette, Globe } from 'lucide-react';

const SystemSettings = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'admin' && profile?.school_id === null;

  if (!user || !profile) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center form-container border-white/50 shadow-lg p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center form-container border-white/50 shadow-lg p-8 rounded-lg">
          <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only super administrators can access system settings.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const settingsCategories = [
    {
      title: 'Database Configuration',
      description: 'Manage database connections, backups, and maintenance',
      icon: <Database className="h-6 w-6" />,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Security Settings',
      description: 'Configure authentication, permissions, and security policies',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      title: 'Notification Settings',
      description: 'Manage system notifications, alerts, and communication',
      icon: <Bell className="h-6 w-6" />,
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Theme Configuration',
      description: 'Customize system appearance, branding, and UI settings',
      icon: <Palette className="h-6 w-6" />,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Localization',
      description: 'Configure language, timezone, and regional settings',
      icon: <Globe className="h-6 w-6" />,
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'System Maintenance',
      description: 'System health monitoring, logs, and maintenance tasks',
      icon: <Settings className="h-6 w-6" />,
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
              <p className="text-white/80">Configure global system preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category, index) => (
            <Card 
              key={index} 
              className={`${category.color} border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer form-container border-white/50 shadow-lg`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`${category.iconColor} p-2 rounded-lg bg-white/50`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {category.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">{category.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white/50 hover:bg-white/80 border-white/50"
                >
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Information */}
        <div className="mt-12">
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">System Version</p>
                  <p className="text-lg font-semibold">v1.0.0</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Database Status</p>
                  <p className="text-lg font-semibold text-green-600">Connected</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Last Backup</p>
                  <p className="text-lg font-semibold">2 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;