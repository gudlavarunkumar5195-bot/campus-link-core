import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SignUpFormProps {
  onBackToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    schoolId: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available schools for tenant selection
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools-for-signup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, address')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const assignTenantAndRole = async (userId: string, tenantId: string, role: string) => {
    const assignTenantSecret = 'dev-secret-key-change-in-production'; // TODO: Make this configurable
    
    try {
      const response = await fetch('/api/assignTenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-assign-tenant-secret': assignTenantSecret
        },
        body: JSON.stringify({
          userId,
          tenantId,
          role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign tenant and role');
      }

      const result = await response.json();
      console.log('Tenant assignment successful:', result);
      return result;
    } catch (error) {
      console.error('Error assigning tenant and role:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!formData.schoolId || !formData.role) {
        throw new Error('Please select both a school and role');
      }

      console.log('Starting signup process...', {
        email: formData.email,
        role: formData.role,
        schoolId: formData.schoolId
      });

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
            school_id: formData.schoolId
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('User created in auth:', authData.user.id);

      // Assign tenant and role via serverless function
      try {
        await assignTenantAndRole(authData.user.id, formData.schoolId, formData.role);
        console.log('Tenant and role assigned successfully');
      } catch (tenantError) {
        console.error('Failed to assign tenant and role:', tenantError);
        // Don't fail the entire signup for this - user can be manually assigned later
        toast({
          title: "Warning",
          description: "Account created but tenant assignment failed. Please contact support.",
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });

      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        schoolId: ''
      });

      // Go back to login after successful signup
      setTimeout(() => {
        onBackToLogin();
      }, 2000);

    } catch (error: any) {
      console.error('Signup error:', error);
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
    <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-amber-600">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Join your school's ERP system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-red-700 font-semibold">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
                className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-red-700 font-semibold">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                required
                className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-red-700 font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-red-700 font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              minLength={6}
              className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-red-700 font-semibold">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              minLength={6}
              className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div>
            <Label className="text-red-700 font-semibold">School</Label>
            <Select value={formData.schoolId} onValueChange={handleSelectChange('schoolId')}>
              <SelectTrigger className="border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder={schoolsLoading ? "Loading schools..." : "Select your school"} />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                    {school.address && <span className="text-sm text-gray-500 ml-2">({school.address})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-red-700 font-semibold">Role</Label>
            <Select value={formData.role} onValueChange={handleSelectChange('role')}>
              <SelectTrigger className="border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={loading || schoolsLoading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={onBackToLogin}
              disabled={loading}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;