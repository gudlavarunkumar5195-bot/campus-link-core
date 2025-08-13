import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const AddStudent = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    student_id: '',
    admission_date: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    medical_info: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    nationality: '',
    religion: '',
    previous_school: '',
    transport_mode: '',
    fee_category: '',
    scholarship_applicable: false,
    hostel_required: false,
    class_preference: '',
    documents_submitted: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentToggle = (document: string) => {
    setFormData(prev => ({
      ...prev,
      documents_submitted: prev.documents_submitted.includes(document)
        ? prev.documents_submitted.filter(doc => doc !== document)
        : [...prev.documents_submitted, document]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) {
      toast({
        title: "Error",
        description: "No school association found. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const profileId = uuidv4();
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'student' as const,
          school_id: profile.school_id,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender as 'male' | 'female' | 'other' || null,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      const { error: studentError } = await supabase
        .from('students')
        .insert({
          profile_id: newProfile.id,
          student_id: formData.student_id || `STD${Date.now()}`,
          admission_date: formData.admission_date || new Date().toISOString().split('T')[0],
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          medical_info: formData.medical_info,
        });

      if (studentError) throw studentError;

      try {
        const { data: username } = await supabase.rpc('generate_username', {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'student',
          school_id: profile.school_id
        });

        const defaultPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        await supabase
          .from('user_credentials')
          .insert({
            profile_id: newProfile.id,
            username: username,
            default_password: defaultPassword,
          });
      } catch (credError) {
        console.warn('Failed to generate credentials:', credError);
      }

      toast({
        title: "Success",
        description: "Student added successfully",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.school_id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">No School Association</h2>
            <p className="text-gray-600 mb-4">
              Please associate your account with a school first.
            </p>
            <Button onClick={() => navigate('/school-config')} variant="outline">
              Go to School Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentTypes = [
    'Birth Certificate',
    'Previous School TC',
    'Aadhar Card',
    'Passport Photo',
    'Medical Certificate',
    'Caste Certificate',
    'Income Certificate'
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add Student</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, 'gender')}>
                      <SelectTrigger>
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
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, 'blood_group')}>
                      <SelectTrigger>
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
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="e.g., Indian"
                    />
                  </div>
                  <div>
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      name="religion"
                      value={formData.religion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                    <Input
                      id="parent_name"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                    <Input
                      id="parent_phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                    <Input
                      id="parent_email"
                      name="parent_email"
                      type="email"
                      value={formData.parent_email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="admission_date">Admission Date</Label>
                    <Input
                      id="admission_date"
                      name="admission_date"
                      type="date"
                      value={formData.admission_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class_preference">Class Preference</Label>
                    <Input
                      id="class_preference"
                      name="class_preference"
                      value={formData.class_preference}
                      onChange={handleChange}
                      placeholder="e.g., 10th Grade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="previous_school">Previous School</Label>
                    <Input
                      id="previous_school"
                      name="previous_school"
                      value={formData.previous_school}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transport_mode">Transport Mode</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, 'transport_mode')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transport mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school_bus">School Bus</SelectItem>
                        <SelectItem value="private">Private Vehicle</SelectItem>
                        <SelectItem value="walking">Walking</SelectItem>
                        <SelectItem value="public_transport">Public Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fee_category">Fee Category</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, 'fee_category')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="management">Management Quota</SelectItem>
                        <SelectItem value="scholarship">Scholarship</SelectItem>
                        <SelectItem value="staff_ward">Staff Ward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="scholarship_applicable"
                      name="scholarship_applicable"
                      checked={formData.scholarship_applicable}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <Label htmlFor="scholarship_applicable">Scholarship Applicable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hostel_required"
                      name="hostel_required"
                      checked={formData.hostel_required}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <Label htmlFor="hostel_required">Hostel Required</Label>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Documents Submitted</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {documentTypes.map((document) => (
                    <div key={document} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`doc-${document}`}
                        checked={formData.documents_submitted.includes(document)}
                        onChange={() => handleDocumentToggle(document)}
                        className="rounded"
                      />
                      <Label htmlFor={`doc-${document}`} className="text-sm">
                        {document}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
                <div>
                  <Label htmlFor="medical_info">Medical Information / Allergies</Label>
                  <Textarea
                    id="medical_info"
                    name="medical_info"
                    value={formData.medical_info}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any medical conditions, allergies, or special requirements"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Student...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStudent;
