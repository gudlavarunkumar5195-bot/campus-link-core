
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useClasses, useClassSections, GENDER_OPTIONS, BLOOD_GROUPS, TRANSPORT_MODES, RELIGIONS, GUARDIAN_RELATIONSHIPS, FEE_CATEGORIES } from '@/hooks/useDropdownData';

const AddStudent = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: classes = [] } = useClasses();
  
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
    
    // Academic Information
    student_id: '',
    roll_number: '',
    admission_date: '',
    class_id: '',
    section: '',
    academic_year: new Date().getFullYear().toString(),
    previous_class: '',
    previous_school: '',
    tc_number: '',
    
    // Parent/Guardian Information
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Health Information
    medical_info: '',
    medical_conditions: '',
    allergies: '',
    special_needs: '',
    
    // Transport & Accommodation
    transport_mode: '',
    transport_required: false,
    hostel_resident: false,
    
    // Fee Information
    fee_category: '',
    scholarship_details: '',
    
    // Additional
     documents_submitted: [] as string[]
   });
   
  const { data: sections = [] } = useClassSections(formData.class_id);

  // Generate a unique student ID like STD2025-1234 and ensure it's unique in DB
  const generateCandidateId = () => `STD${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const ensureUniqueStudentId = async (): Promise<string> => {
    for (let i = 0; i < 5; i++) {
      const candidate = generateCandidateId();
      const { error, count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', candidate);
      if (!error && (count ?? 0) === 0) return candidate;
    }
    return generateCandidateId();
  };

  React.useEffect(() => {
    (async () => {
      if (!formData.student_id) {
        const uniqueId = await ensureUniqueStudentId();
        setFormData(prev => ({ ...prev, student_id: uniqueId }));
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
      // Generate a default password for the student
      const defaultPassword = `School${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Invoke secure Edge Function to create auth user + profile + student record
      const { data, error } = await supabase.functions.invoke('admin-create-student', {
        body: {
          school_id: profile.school_id,
          // Profile basics
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
          previous_school: formData.previous_school || null,
          guardian_name: formData.guardian_name || null,
          guardian_phone: formData.guardian_phone || null,
          guardian_email: formData.guardian_email || null,
          guardian_relationship: formData.guardian_relationship || null,
          transport_mode: formData.transport_mode || null,
          medical_conditions: formData.medical_conditions || null,
          allergies: formData.allergies || null,
          special_needs: formData.special_needs || null,

          // Student specifics
          student_id: formData.student_id,
          roll_number: formData.roll_number || null,
          class_id: formData.class_id || null,
          admission_date: formData.admission_date,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          parent_email: formData.parent_email || null,
          medical_info: formData.medical_info || null,
          academic_year: formData.academic_year || null,
          section: formData.section || null,
          hostel_resident: formData.hostel_resident,
          transport_required: formData.transport_required,
          fee_category: formData.fee_category || null,
          scholarship_details: formData.scholarship_details || null,
          previous_class: formData.previous_class || null,
          tc_number: formData.tc_number || null,
          documents_submitted: formData.documents_submitted || [],

          // Credentials
          password: defaultPassword,
        },
      });

      // Handle network/transport errors
      if (error) {
        console.error('Edge function transport error:', error);
        toast({
          title: "Network Error",
          description: `Connection failed: ${error.message}. Please check your internet connection and try again.`,
          variant: "destructive",
        });
        return;
      }

      // Handle business logic errors (non-2xx status codes)
      if (!data?.success) {
        console.error('Edge function business error:', data);
        toast({
          title: "Validation Error",
          description: data?.error || "Failed to create student. Please check all required fields and try again.",
          variant: "destructive",
        });
        return;
      }

      // Success case
      toast({
        title: 'Success',
        description: `Student added successfully. Temporary password: ${defaultPassword}`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Unexpected error adding student:', error);
      toast({
        title: 'Unexpected Error',
        description: `Something went wrong: ${error?.message || 'Unknown error'}. Please try again or contact support.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
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
                Add Student
              </h1>
              <p className="text-muted-foreground">Add a new student to the school</p>
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

          {/* Academic Information */}
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id">Student ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => handleInputChange('student_id', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const uniqueId = await ensureUniqueStudentId();
                      setFormData(prev => ({ ...prev, student_id: uniqueId }));
                      toast({ description: 'Generated a new Student ID' });
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="roll_number">Roll Number</Label>
                <Input
                  id="roll_number"
                  value={formData.roll_number}
                  onChange={(e) => handleInputChange('roll_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="admission_date">Admission Date *</Label>
                <Input
                  id="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => handleInputChange('admission_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="class_id">Class</Label>
                <Select value={formData.class_id} onValueChange={(value) => handleInputChange('class_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                {sections.length > 0 ? (
                  <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    placeholder="Enter section (e.g., A, B, C)"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => handleInputChange('academic_year', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="previous_class">Previous Class</Label>
                <Input
                  id="previous_class"
                  value={formData.previous_class}
                  onChange={(e) => handleInputChange('previous_class', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="previous_school">Previous School</Label>
                <Input
                  id="previous_school"
                  value={formData.previous_school}
                  onChange={(e) => handleInputChange('previous_school', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tc_number">TC Number</Label>
                <Input
                  id="tc_number"
                  value={formData.tc_number}
                  onChange={(e) => handleInputChange('tc_number', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parent/Guardian Information */}
          <Card className="form-container border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_name">Parent Name</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parent_phone">Parent Phone</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parent_email">Parent Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => handleInputChange('parent_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guardian_name">Guardian Name</Label>
                <Input
                  id="guardian_name"
                  value={formData.guardian_name}
                  onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guardian_phone">Guardian Phone</Label>
                <Input
                  id="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guardian_email">Guardian Email</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  value={formData.guardian_email}
                  onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guardian_relationship">Guardian Relationship</Label>
                <Select value={formData.guardian_relationship} onValueChange={(value) => handleInputChange('guardian_relationship', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {GUARDIAN_RELATIONSHIPS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </CardContent>
          </Card>

          {/* Health & Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Health & Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medical_info">Medical Information</Label>
                <Textarea
                  id="medical_info"
                  value={formData.medical_info}
                  onChange={(e) => handleInputChange('medical_info', e.target.value)}
                />
              </div>
              <div>
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

          {/* Transport & Accommodation */}
          <Card>
            <CardHeader>
              <CardTitle>Transport & Accommodation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transport_mode">Transport Mode</Label>
                <Select value={formData.transport_mode} onValueChange={(value) => handleInputChange('transport_mode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {TRANSPORT_MODES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transport_required"
                  checked={formData.transport_required}
                  onCheckedChange={(checked) => handleInputChange('transport_required', checked)}
                />
                <Label htmlFor="transport_required">Transport Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hostel_resident"
                  checked={formData.hostel_resident}
                  onCheckedChange={(checked) => handleInputChange('hostel_resident', checked)}
                />
                <Label htmlFor="hostel_resident">Hostel Resident</Label>
              </div>
            </CardContent>
          </Card>

          {/* Fee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fee_category">Fee Category</Label>
                <Select value={formData.fee_category} onValueChange={(value) => handleInputChange('fee_category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md z-50">
                    {FEE_CATEGORIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scholarship_details">Scholarship Details</Label>
                <Textarea
                  id="scholarship_details"
                  value={formData.scholarship_details}
                  onChange={(e) => handleInputChange('scholarship_details', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Student...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudent;
