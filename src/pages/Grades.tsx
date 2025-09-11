
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TeacherGradesManagement from '@/components/grades/TeacherGradesManagement';
import StudentGradesView from '@/components/grades/StudentGradesView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Grades = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Grades</h1>
            <p className="text-muted-foreground">
              {profile.role === 'teacher' ? 'Manage student grades and assessments' : 'View your academic performance'}
            </p>
          </div>
        </div>

        {profile.role === 'teacher' ? (
          <TeacherGradesManagement />
        ) : profile.role === 'student' ? (
          <StudentGradesView />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Grades view not available for your role.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grades;
