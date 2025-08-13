import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type Gender = 'male' | 'female' | 'other';

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  qualification: string;
  specialization: string;
  hireDate: string;
  salary: string;
  dateOfBirth: string;
  gender: Gender | '';
  address: string;
  subjectIds: string[];
  experience: string;
  previousInstitution: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  nationality: string;
  maritalStatus: string;
  teachingLevel: string;
  contractType: string;
  probationPeriod: string;
  workingHours: string;
  department: string;
  mentorAssigned: boolean;
  trainingCompleted: boolean;
}

const AddTeacher = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    qualification: '',
    specialization: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    subjectIds: [] as string[],
    experience: '',
    previousInstitution: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    nationality: '',
    maritalStatus: '',
    teachingLevel: '',
    contractType: '',
    probationPeriod: '',
    workingHours: '',
    department: '',
    mentorAssigned: false,
    trainingCompleted: false,
  });

  const isAdmin = profile?.role === 'admin';

  const { data: subjects } = useQuery({
    queryKey: ['subjects', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', profile.school_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  if (!user || !profile || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2 text-amber-600">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only administrators can add teachers.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: keyof TeacherFormData, value: string | boolean) => {
    if (field === 'subjectIds') return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenderChange = (value: Gender) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId]
    }));
  };

  const handleCheckboxChange = (field: 'mentorAssigned' | 'trainingCompleted', checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const defaultPassword = `School${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'teacher',
          school_id: profile.school_id
        }
      });

      if (authError) throw authError;

      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          profile_id: authData.user.id,
          employee_id: formData.employeeId,
          qualification: formData.qualification,
          specialization: formData.specialization,
          hire_date: formData.hireDate,
          salary: formData.salary ? parseFloat(formData.salary) : null
        });

      if (teacherError) throw teacherError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          employee_id: formData.employeeId,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender || null,
          address: formData.address,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      if (formData.subjectIds.length > 0) {
        const teacherSubjects = formData.subjectIds.map(subjectId => ({
          teacher_id: authData.user.id,
          subject_id: subjectId
        }));

        const { error: subjectError } = await supabase
          .from('teacher_subjects')
          .insert(teacherSubjects);

        if (subjectError) throw subjectError;
      }

      toast({
        title: "Success",
        description: `Teacher added successfully! Default password: ${defaultPassword}`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-white hover:text-amber-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-600">Add Teacher</h1>
            <p className="text-gray-400">Create a new teacher account</p>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-600">
              <UserPlus className="h-5 w-5" />
              <span>Teacher Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-red-700 font-semibold">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-red-700 font-semibold">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeId" className="text-red-700 font-semibold">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-red-700 font-semibold">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-red-700 font-semibold">Gender</Label>
                    <Select value={formData.gender} onValueChange={handleGenderChange}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup" className="text-red-700 font-semibold">Blood Group</Label>
                    <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationality" className="text-red-700 font-semibold">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus" className="text-red-700 font-semibold">Marital Status</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-red-700 font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-red-700 font-semibold">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-red-700 font-semibold">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName" className="text-red-700 font-semibold">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone" className="text-red-700 font-semibold">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Qualifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Academic Qualifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualification" className="text-red-700 font-semibold">Qualification</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., M.Ed, B.Ed, M.A."
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization" className="text-red-700 font-semibold">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience" className="text-red-700 font-semibold">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="previousInstitution" className="text-red-700 font-semibold">Previous Institution</Label>
                    <Input
                      id="previousInstitution"
                      value={formData.previousInstitution}
                      onChange={(e) => handleInputChange('previousInstitution', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teachingLevel" className="text-red-700 font-semibold">Teaching Level</Label>
                    <Select value={formData.teachingLevel} onValueChange={(value) => handleInputChange('teachingLevel', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select teaching level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary (1-5)</SelectItem>
                        <SelectItem value="middle">Middle (6-8)</SelectItem>
                        <SelectItem value="secondary">Secondary (9-10)</SelectItem>
                        <SelectItem value="higher_secondary">Higher Secondary (11-12)</SelectItem>
                        <SelectItem value="all">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-red-700 font-semibold">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Science, Arts, Commerce"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hireDate" className="text-red-700 font-semibold">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => handleInputChange('hireDate', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary" className="text-red-700 font-semibold">Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractType" className="text-red-700 font-semibold">Contract Type</Label>
                    <Select value={formData.contractType} onValueChange={(value) => handleInputChange('contractType', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="probationPeriod" className="text-red-700 font-semibold">Probation Period (months)</Label>
                    <Input
                      id="probationPeriod"
                      type="number"
                      value={formData.probationPeriod}
                      onChange={(e) => handleInputChange('probationPeriod', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., 6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingHours" className="text-red-700 font-semibold">Working Hours</Label>
                    <Select value={formData.workingHours} onValueChange={(value) => handleInputChange('workingHours', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select working hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time (8 hours)</SelectItem>
                        <SelectItem value="part_time">Part Time (4 hours)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mentorAssigned"
                      checked={formData.mentorAssigned}
                      onChange={(e) => handleCheckboxChange('mentorAssigned', e.target.checked)}
                      className="rounded border-slate-600 text-green-600 focus:ring-green-500"
                    />
                    <Label htmlFor="mentorAssigned" className="text-white">
                      Mentor Assigned
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trainingCompleted"
                      checked={formData.trainingCompleted}
                      onChange={(e) => handleCheckboxChange('trainingCompleted', e.target.checked)}
                      className="rounded border-slate-600 text-green-600 focus:ring-green-500"
                    />
                    <Label htmlFor="trainingCompleted" className="text-white">
                      Initial Training Completed
                    </Label>
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Subjects</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects?.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        checked={formData.subjectIds.includes(subject.id)}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="rounded border-slate-600 text-green-600 focus:ring-green-500"
                      />
                      <Label htmlFor={`subject-${subject.id}`} className="text-sm text-white">
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Teacher
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTeacher;
