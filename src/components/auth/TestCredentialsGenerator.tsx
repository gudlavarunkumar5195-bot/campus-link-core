
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Copy, Eye, EyeOff } from 'lucide-react';

interface TestCredential {
  username: string;
  password: string;
  role: string;
  name: string;
}

const TestCredentialsGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [testCredentials, setTestCredentials] = useState<TestCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const { toast } = useToast();

  const generateTestUsers = async () => {
    setGenerating(true);
    
    try {
      // Get the first school or create one if none exists
      let { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name')
        .limit(1);

      if (schoolsError) throw schoolsError;

      let schoolId = schools?.[0]?.id;
      
      if (!schoolId) {
        // Create a test school
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: 'Test School',
            address: '123 Test Street',
            phone: '+1234567890',
            email: 'test@school.edu'
          })
          .select()
          .single();

        if (schoolError) throw schoolError;
        schoolId = newSchool.id;
      }

      // Test users to create
      const testUsers = [
        {
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@test.com',
          role: 'admin' as const,
          employee_id: 'ADM001'
        },
        {
          first_name: 'John',
          last_name: 'Teacher',
          email: 'teacher@test.com',
          role: 'teacher' as const,
          employee_id: 'TCH001'
        },
        {
          first_name: 'Jane',
          last_name: 'Student',
          email: 'student@test.com',
          role: 'student' as const,
          student_id: 'STD001'
        }
      ];

      const createdCredentials: TestCredential[] = [];

      for (const user of testUsers) {
        // Check if user already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single();

        if (existingProfile) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }

        // Generate default password
        const defaultPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        // Create auth user first
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: defaultPassword,
          options: {
            data: {
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
              school_id: schoolId
            }
          }
        });

        if (authError) {
          console.error('Auth user creation error:', authError);
          continue;
        }

        if (!authUser.user) {
          console.error('No user returned from auth signup');
          continue;
        }

        // Create profile with the auth user's ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            school_id: schoolId,
            employee_id: user.role !== 'student' ? user.employee_id : undefined,
            is_active: true
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          continue;
        }

        // Create role-specific record
        if (user.role === 'student') {
          await supabase
            .from('students')
            .insert({
              profile_id: authUser.user.id,
              student_id: user.student_id || 'STD001',
              admission_date: new Date().toISOString().split('T')[0],
              parent_name: 'Test Parent',
              parent_phone: '+1234567890',
              parent_email: 'parent@test.com'
            });
        } else if (user.role === 'teacher') {
          await supabase
            .from('teachers')
            .insert({
              profile_id: authUser.user.id,
              employee_id: user.employee_id || 'TCH001',
              hire_date: new Date().toISOString().split('T')[0],
              qualification: 'Test Qualification',
              specialization: 'Test Subject'
            });
        } else if (user.role === 'admin') {
          await supabase
            .from('staff')
            .insert({
              profile_id: authUser.user.id,
              employee_id: user.employee_id || 'ADM001',
              hire_date: new Date().toISOString().split('T')[0],
              position: 'Administrator'
            });
        }

        // Generate username using the RPC function
        const { data: username, error: usernameError } = await supabase.rpc('generate_username', {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          school_id: schoolId
        });

        if (usernameError) {
          console.error('Username generation error:', usernameError);
          continue;
        }

        // Create user credentials
        const { error: credentialsError } = await supabase
          .from('user_credentials')
          .insert({
            profile_id: authUser.user.id,
            username: username,
            default_password: defaultPassword,
            is_active: true
          });

        if (credentialsError) {
          console.error('Credentials creation error:', credentialsError);
          continue;
        }

        createdCredentials.push({
          username: username,
          password: defaultPassword,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`
        });
      }

      setTestCredentials(createdCredentials);
      
      toast({
        title: "Success",
        description: `Generated ${createdCredentials.length} test users with credentials!`,
      });

    } catch (error: any) {
      console.error('Error generating test users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate test users",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const copyAllCredentials = () => {
    const credentialsText = testCredentials.map(cred => 
      `Username: ${cred.username}\nPassword: ${cred.password}\nRole: ${cred.role}\nName: ${cred.name}\n`
    ).join('\n---\n');
    
    copyToClipboard(credentialsText);
  };

  return (
    <Card className="bg-white max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Test Credentials Generator</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate test users with proper login credentials for testing the authentication system.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateTestUsers}
          disabled={generating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {generating ? 'Generating...' : 'Generate Test Users & Credentials'}
        </Button>

        {testCredentials.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Test Credentials</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswords ? 'Hide' : 'Show'} Passwords
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllCredentials}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {testCredentials.map((cred, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{cred.role}</Badge>
                      <span className="font-medium">{cred.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600">Username:</label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white p-1 rounded font-mono text-sm border">
                          {cred.username}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cred.username)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-600">Password:</label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white p-1 rounded font-mono text-sm border">
                          {showPasswords ? cred.password : '••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cred.password)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to the login page</li>
                <li>Select "Username Login" tab</li>
                <li>Enter any username and password from above</li>
                <li>Click "Sign in with Username"</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCredentialsGenerator;
