import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BulkUploadForm from '@/components/bulk-upload/BulkUploadForm';

const BulkUpload = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

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

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center form-container border-white/50 shadow-lg p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only administrators can access bulk upload functionality.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-white">Bulk Upload</h1>
              <p className="text-white/80">Import multiple records at once</p>
            </div>
          </div>
        </div>

        <div className="form-container border-white/50 shadow-lg rounded-lg">
          <BulkUploadForm schoolId={profile?.school_id || ''} />
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;