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

type Gender = 'male' | 'female' | 'other';

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  position: string;
  hireDate: string;
  salary: string;
  dateOfBirth: string;
  gender: Gender | '';
  address: string;
  department: string;
  qualification: string;
  experience: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  nationality: string;
  maritalStatus: string;
  contractType: string;
  workingHours: string;
  reportingManager: string;
  workLocation: string;
  skills: string;
  responsibilities: string;
  probationPeriod: string;
  trainingRequired: boolean;
  accessLevel: string;
}

const AddStaff = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    department: '',
    qualification: '',
    experience: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    nationality: '',
    maritalStatus: '',
    contractType: '',
    workingHours: '',
    reportingManager: '',
    workLocation: '',
    skills: '',
    responsibilities: '',
    probationPeriod: '',
    trainingRequired: false,
    accessLevel: '',
  });

  const isAdmin = profile?.role === 'admin';

  if (!user || !profile || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2 text-amber-600">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only administrators can add staff.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: keyof StaffFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenderChange = (value: Gender) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleCheckboxChange = (field: 'trainingRequired', checked: boolean) => {
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
          role: 'admin',
          school_id: profile.school_id
        }
      });

      if (authError) throw authError;

      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          profile_id: authData.user.id,
          employee_id: formData.employeeId,
          position: formData.position,
          hire_date: formData.hireDate,
          salary: formData.salary ? parseFloat(formData.salary) : null
        });

      if (staffError) throw staffError;

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

      toast({
        title: "Success",
        description: `Staff member added successfully! Default password: ${defaultPassword}`,
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
            <h1 className="text-3xl font-bold text-amber-600">Add Staff</h1>
            <p className="text-gray-400">Create a new staff account</p>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-600">
              <UserPlus className="h-5 w-5" />
              <span>Staff Information</span>
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

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-amber-500 border-b border-slate-600 pb-2">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position" className="text-red-700 font-semibold">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Administrator, Clerk, Librarian"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-red-700 font-semibold">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administration">Administration</SelectItem>
                        <SelectItem value="accounts">Accounts</SelectItem>
                        <SelectItem value="library">Library</SelectItem>
                        <SelectItem value="laboratory">Laboratory</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="canteen">Canteen</SelectItem>
                        <SelectItem value="it">IT Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualification" className="text-red-700 font-semibold">Qualification</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., B.Com, MBA, Diploma"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportingManager" className="text-red-700 font-semibold">Reporting Manager</Label>
                    <Input
                      id="reportingManager"
                      value={formData.reportingManager}
                      onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workLocation" className="text-red-700 font-semibold">Work Location</Label>
                    <Input
                      id="workLocation"
                      value={formData.workLocation}
                      onChange={(e) => handleInputChange('workLocation', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Main Office, Library, Lab"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="skills" className="text-red-700 font-semibold">Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={2}
                    placeholder="List relevant skills (e.g., Computer proficiency, Communication, etc.)"
                  />
                </div>

                <div>
                  <Label htmlFor="responsibilities" className="text-red-700 font-semibold">Key Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    value={formData.responsibilities}
                    onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                    placeholder="Describe main job responsibilities"
                  />
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <SelectItem value="shift_based">Shift Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label htmlFor="accessLevel" className="text-red-700 font-semibold">Access Level</Label>
                    <Select value={formData.accessLevel} onValueChange={(value) => handleInputChange('accessLevel', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="admin">Administrative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="trainingRequired"
                    checked={formData.trainingRequired}
                    onChange={(e) => handleCheckboxChange('trainingRequired', e.target.checked)}
                    className="rounded border-slate-600 text-green-600 focus:ring-green-500"
                  />
                  <Label htmlFor="trainingRequired" className="text-white">
                    Training Required
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff Member
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStaff;
