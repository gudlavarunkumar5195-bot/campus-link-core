
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, FileText, ClipboardList, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-600">Student Dashboard</h1>
          <p className="text-gray-400">Welcome back, {profile?.first_name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <BookOpen className="h-5 w-5" />
                <span>My Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                View your enrolled classes and subjects
              </p>
              <Button 
                onClick={() => navigate('/classes')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Classes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Calendar className="h-5 w-5" />
                <span>Timetable</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                View your class schedule and timetable
              </p>
              <Button 
                onClick={() => navigate('/timetable')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Timetable
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <ClipboardList className="h-5 w-5" />
                <span>My Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                View your attendance records and status
              </p>
              <Button 
                onClick={() => navigate('/attendance')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <GraduationCap className="h-5 w-5" />
                <span>My Grades</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                View your grades and academic progress
              </p>
              <Button 
                onClick={() => navigate('/grades')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Grades
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <FileText className="h-5 w-5" />
                <span>Assignments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                View and submit your assignments
              </p>
              <Button 
                onClick={() => navigate('/assignments')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Assignments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
