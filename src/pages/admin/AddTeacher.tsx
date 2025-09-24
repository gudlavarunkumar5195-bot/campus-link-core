
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useDepartments, useSubjects, GENDER_OPTIONS, BLOOD_GROUPS, RELIGIONS, EMPLOYMENT_TYPES } from '@/hooks/useDropdownData';

const AddTeacher = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: departments = [] } = useDepartments();
  const { data: subjects = [] } = useSubjects();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    nationality: '',
    religion: '',
    address: '',
    
    // Professional Information
    employee_id: '',
    department: '',
    qualification: '',
    specialization: '',
    subjects_taught: '',
    experience_years: '',
    previous_experience: '',
    training_certifications: '',
    
    // Employment Details
    hire_date: '',
    employment_type: 'full_time',
    salary: '',
    probation_period: '',
    contract_end_date: '',
    class_teacher_for: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Health Information
    medical_conditions: '',
    allergies: '',
    special_needs: '',
  });

  // Generate unique employee id like EMP2025-1234 across profiles
  const genEmpId = () => `EMP${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const ensureUniqueEmployeeId = async (): Promise<string> => {
    for (let i = 0; i < 5; i++) {
      const candidate = genEmpId();
      const { error, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', candidate);
      if (!error && (count ?? 0) === 0) return candidate;
    }
    return genEmpId();
  };

  React.useEffect(() => {
    (async () => {
      if (!formData.employee_id) {
        const unique = await ensureUniqueEmployeeId();
        setFormData(prev => ({ ...prev, employee_id: unique }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) {
      toast({
        title: "Error",
        description: "School information not found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const defaultPassword = `School${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Use secure Edge Function to create auth user + profile + teacher record
      const { data, error } = await supabase.functions.invoke('admin-create-teacher', {
        body: {
          school_id: profile.school_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address: formData.address || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          nationality: formData.nationality || null,
          religion: formData.religion || null,
          blood_group: formData.blood_group || null,
          medical_conditions: formData.medical_conditions || null,
          allergies: formData.allergies || null,
          special_needs: formData.special_needs || null,
          employee_id: formData.employee_id,
          
          // Teacher-specific fields
          qualification: formData.qualification || null,
          specialization: formData.specialization || null,
          department: formData.department || null,
          subjects_taught: formData.subjects_taught ? formData.subjects_taught.split(',').map(s => s.trim()).filter(s => s) : [],
          experience_years: formData.experience_years || null,
          previous_experience: formData.previous_experience || null,
          training_certifications: formData.training_certifications ? formData.training_certifications.split(',').map(s => s.trim()).filter(s => s) : [],
          hire_date: formData.hire_date,
          employment_type: formData.employment_type,
          salary: formData.salary || null,
          probation_period: formData.probation_period || null,
          contract_end_date: formData.contract_end_date || null,
          class_teacher_for: formData.class_teacher_for || null,
          
          password: defaultPassword,
        },
      });

      // Handle network/transport errors and edge function errors
      if (error) {
        console.error('Edge function transport error:', error);
        
        // Check if it's a validation error from the edge function (non-2xx response)
        if (error.message.includes('Edge Function returned a non-2xx status code')) {
          // This is likely a validation error from the edge function
          toast({
            title: "Validation Error", 
            description: "Failed to create teacher. Please check that the email isn't already registered, employee ID is unique, and all required fields are filled.",
            variant: "destructive",
          });
        } else {
          // Network error
          toast({
            title: "Network Error",
            description: `Connection failed: ${error.message}. Please check your internet connection and try again.`,
            variant: "destructive",
          });
        }
        return;
      }

      // Handle business logic errors (non-2xx status codes)  
      if (!data?.success) {
        console.error('Edge function business error:', data);
        toast({
          title: "Validation Error",
          description: data?.error || "Failed to create teacher. Please check all required fields and try again.",
          variant: "destructive",
        });
        return;
      }

      // Success case
      toast({
        title: "Success",
        description: `Teacher added successfully. Temporary password: ${defaultPassword}`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Unexpected error adding teacher:', error);
      toast({
        title: "Unexpected Error",
        description: `Something went wrong: ${error?.message || 'Unknown error'}. Please try again or contact support.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStringChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 glass-effect"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-8 w-8" />
                Add Teacher
              </h1>
              <p className="text-muted-foreground">Add a new teacher to the school</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="blood_group">Blood Group</Label>
                <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {BLOOD_GROUPS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="religion">Religion</Label>
                <Select value={formData.religion} onValueChange={(value) => handleInputChange('religion', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {RELIGIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_id">Employee ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const uniqueId = await ensureUniqueEmployeeId();
                      setFormData(prev => ({ ...prev, employee_id: uniqueId }));
                      toast({ description: 'Generated a new Employee ID' });
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subjects_taught">Subjects Taught (comma separated)</Label>
                <Input
                  id="subjects_taught"
                  value={formData.subjects_taught}
                  onChange={(e) => handleStringChange('subjects_taught', e.target.value)}
                  placeholder="Mathematics, Science, English"
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => handleInputChange('experience_years', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="class_teacher_for">Class Teacher For</Label>
                <Input
                  id="class_teacher_for"
                  value={formData.class_teacher_for}
                  onChange={(e) => handleInputChange('class_teacher_for', e.target.value)}
                  placeholder="e.g., Class 5-A"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="previous_experience">Previous Experience</Label>
                <Textarea
                  id="previous_experience"
                  value={formData.previous_experience}
                  onChange={(e) => handleInputChange('previous_experience', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="training_certifications">Training & Certifications (comma separated)</Label>
                <Input
                  id="training_certifications"
                  value={formData.training_certifications}
                  onChange={(e) => handleStringChange('training_certifications', e.target.value)}
                  placeholder="B.Ed, M.Ed, Computer Training"
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hire_date">Hire Date *</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {EMPLOYMENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="probation_period">Probation Period (months)</Label>
                <Input
                  id="probation_period"
                  type="number"
                  value={formData.probation_period}
                  onChange={(e) => handleInputChange('probation_period', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contract_end_date">Contract End Date</Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact & Health */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact & Health Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="special_needs">Special Needs</Label>
                <Textarea
                  id="special_needs"
                  value={formData.special_needs}
                  onChange={(e) => handleInputChange('special_needs', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Teacher...' : 'Add Teacher'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;
