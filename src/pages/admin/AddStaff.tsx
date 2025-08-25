
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
import { useDepartments, useStaff, GENDER_OPTIONS, BLOOD_GROUPS, RELIGIONS, EMPLOYMENT_TYPES, SHIFT_TIMINGS } from '@/hooks/useDropdownData';

const AddStaff = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: departments = [] } = useDepartments();
  const { data: staff = [] } = useStaff();
  
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
    position: '',
    department: '',
    supervisor_id: '',
    responsibilities: [] as string[],
    certifications: [] as string[],
    
    // Employment Details
    hire_date: '',
    employment_type: 'full_time',
    salary: '',
    shift_timing: '',
    probation_period: '',
    contract_end_date: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Health Information
    medical_conditions: '',
    allergies: '',
    special_needs: '',
  });

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
      const profileId = uuidv4();
      
      // Create profile with proper type casting for gender
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'admin' as const,
          school_id: profile.school_id,
          date_of_birth: formData.date_of_birth || null,
          gender: (formData.gender as "male" | "female" | "other") || null,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          nationality: formData.nationality,
          religion: formData.religion,
          blood_group: formData.blood_group,
          medical_conditions: formData.medical_conditions,
          allergies: formData.allergies,
          special_needs: formData.special_needs,
          employee_id: formData.employee_id,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create staff record
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          profile_id: profileId,
          employee_id: formData.employee_id,
          position: formData.position,
          hire_date: formData.hire_date,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          department: formData.department,
          supervisor_id: formData.supervisor_id || null,
          employment_type: formData.employment_type,
          shift_timing: formData.shift_timing,
          probation_period: formData.probation_period ? parseInt(formData.probation_period) : null,
          contract_end_date: formData.contract_end_date || null,
          responsibilities: formData.responsibilities,
          certifications: formData.certifications,
        });

      if (staffError) throw staffError;

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, value: string) => {
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    setFormData(prev => ({ ...prev, [field]: values }));
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-8 w-8" />
                Add Staff
              </h1>
              <p className="text-gray-600">Add a new staff member to the school</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  required
                />
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
                <Label htmlFor="supervisor_id">Supervisor</Label>
                <Select value={formData.supervisor_id} onValueChange={(value) => handleInputChange('supervisor_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.profile_id} value={staffMember.profile_id}>
                        {staffMember.profiles?.first_name} {staffMember.profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="responsibilities">Responsibilities (comma separated)</Label>
                <Input
                  id="responsibilities"
                  value={formData.responsibilities.join(', ')}
                  onChange={(e) => handleArrayChange('responsibilities', e.target.value)}
                  placeholder="Manage accounts, Handle admissions, Coordinate events"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="certifications">Certifications (comma separated)</Label>
                <Input
                  id="certifications"
                  value={formData.certifications.join(', ')}
                  onChange={(e) => handleArrayChange('certifications', e.target.value)}
                  placeholder="MBA, CPA, First Aid Certificate"
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
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
                <Label htmlFor="shift_timing">Shift Timing</Label>
                <Select value={formData.shift_timing} onValueChange={(value) => handleInputChange('shift_timing', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift timing" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {SHIFT_TIMINGS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {loading ? 'Adding Staff...' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;
