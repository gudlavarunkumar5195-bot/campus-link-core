
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
    setTestCredentials([]);
    
    try {
      console.log('🚀 Starting demo user generation...');
      
      // Get or create a demo school
      console.log('📝 Looking for existing schools...');
      let { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name')
        .limit(1);

      console.log('Schools query result:', { schools, error: schoolsError });

      if (schoolsError) {
        console.error('❌ School query error:', schoolsError);
        throw schoolsError;
      }

      let schoolId = schools?.[0]?.id;
      
      if (!schoolId) {
        console.log('🏫 Creating demo school...');
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: 'Demo School',
            address: '123 Demo Street, Demo City',
            phone: '+1234567890',
            email: 'admin@demoschool.edu'
          })
          .select()
          .single();

        console.log('School creation result:', { newSchool, error: schoolError });
        
        if (schoolError) {
          console.error('❌ School creation error:', schoolError);
          throw schoolError;
        }
        schoolId = newSchool.id;
        console.log('✅ Demo school created:', schoolId);
      } else {
        console.log('✅ Using existing school:', schoolId);
      }

      // Test users to create
      const testUsers = [
        {
          first_name: 'Admin',
          last_name: 'Demo',
          email: 'admin@demo.com',
          role: 'admin' as const,
          username: 'admin.demo',
          password: 'School2024'
        },
        {
          first_name: 'Teacher',
          last_name: 'Demo',
          email: 'teacher@demo.com',
          role: 'teacher' as const,
          username: 'teacher.demo',
          password: 'School2024'
        },
        {
          first_name: 'Student',
          last_name: 'Demo',
          email: 'student@demo.com',
          role: 'student' as const,
          username: 'student.demo',
          password: 'School2024'
        }
      ];

      const createdCredentials: TestCredential[] = [];

      for (const user of testUsers) {
        try {
          console.log(`👤 Creating demo user: ${user.email}`);
          
          // Check if user already exists
          const { data: existingProfile, error: existingError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          console.log(`Profile lookup for ${user.email}:`, { existingProfile, existingError });

          let profileId;

          if (existingProfile) {
            console.log(`♻️ Using existing profile for ${user.email}:`, existingProfile.id);
            profileId = existingProfile.id;
            
            // Update the existing profile
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                school_id: schoolId,
                is_active: true
              })
              .eq('id', profileId);

            if (updateError) {
              console.error(`❌ Profile update error for ${user.email}:`, updateError);
              throw updateError;
            }
            console.log(`✅ Updated profile for ${user.email}`);
          } else {
            // Create new profile
            profileId = crypto.randomUUID();
            console.log(`🆕 Creating new profile with ID: ${profileId}`);
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: profileId,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                school_id: schoolId,
                is_active: true
              });

            if (profileError) {
              console.error(`❌ Profile creation error for ${user.email}:`, profileError);
              throw profileError;
            }
            console.log(`✅ Created profile for ${user.email}`);
          }

          // Create or update credentials
          console.log(`🔑 Creating credentials for ${user.email}...`);
          const { error: credError } = await supabase
            .from('user_credentials')
            .upsert({
              profile_id: profileId,
              username: user.username,
              default_password: user.password,
              is_active: true
            }, {
              onConflict: 'profile_id'
            });

          if (credError) {
            console.error(`❌ Credentials error for ${user.email}:`, credError);
            throw credError;
          }
          console.log(`✅ Created credentials for ${user.email}`);

          // Verify credentials were created
          const { data: verifyCredentials } = await supabase
            .from('user_credentials')
            .select('username, default_password')
            .eq('profile_id', profileId)
            .single();
          
          console.log(`🔍 Verified credentials for ${user.email}:`, verifyCredentials);

          // Create role-specific records
          console.log(`👔 Creating role-specific record for ${user.role}...`);
          if (user.role === 'student') {
            const { error: studentError } = await supabase
              .from('students')
              .upsert({
                profile_id: profileId,
                student_id: `STD${Date.now().toString().slice(-3)}`,
                admission_date: new Date().toISOString().split('T')[0],
                parent_name: 'Demo Parent',
                parent_phone: '+1234567890',
                parent_email: 'parent@demo.com'
              }, {
                onConflict: 'profile_id'
              });
            
            if (studentError) {
              console.error(`❌ Student record error:`, studentError);
            } else {
              console.log(`✅ Created student record`);
            }
          } else if (user.role === 'teacher') {
            const { error: teacherError } = await supabase
              .from('teachers')
              .upsert({
                profile_id: profileId,
                employee_id: `TCH${Date.now().toString().slice(-3)}`,
                hire_date: new Date().toISOString().split('T')[0],
                qualification: 'Master of Education',
                specialization: 'Mathematics'
              }, {
                onConflict: 'profile_id'
              });
              
            if (teacherError) {
              console.error(`❌ Teacher record error:`, teacherError);
            } else {
              console.log(`✅ Created teacher record`);
            }
          } else if (user.role === 'admin') {
            const { error: staffError } = await supabase
              .from('staff')
              .upsert({
                profile_id: profileId,
                employee_id: `ADM${Date.now().toString().slice(-3)}`,
                hire_date: new Date().toISOString().split('T')[0],
                position: 'School Administrator'
              }, {
                onConflict: 'profile_id'
              });
              
            if (staffError) {
              console.error(`❌ Staff record error:`, staffError);
            } else {
              console.log(`✅ Created staff record`);
            }
          }

          console.log(`🎉 Successfully created demo user ${user.username}`);

          createdCredentials.push({
            username: user.username,
            password: user.password,
            role: user.role,
            name: `${user.first_name} ${user.last_name}`
          });

        } catch (userError: any) {
          console.error(`❌ Error processing user ${user.email}:`, userError);
          toast({
            title: "User Creation Error",
            description: `Failed to create ${user.email}: ${userError.message}`,
            variant: "destructive",
          });
          continue;
        }
      }

      console.log(`🎯 Final result: Created ${createdCredentials.length} users`);
      setTestCredentials(createdCredentials);
      
      if (createdCredentials.length > 0) {
        toast({
          title: "Success! 🎉",
          description: `Generated ${createdCredentials.length} demo users with credentials!`,
        });
      } else {
        toast({
          title: "Warning",
          description: "No demo users were created. Check console for errors.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ Critical error generating test users:', error);
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
          <span>Demo Credentials Generator</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate demo users with easy-to-remember login credentials for testing.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateTestUsers}
          disabled={generating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {generating ? 'Generating...' : 'Generate Demo Users & Credentials'}
        </Button>

        {testCredentials.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Demo Login Credentials</h3>
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
              <h4 className="font-medium text-blue-900 mb-2">Quick Demo Login:</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="font-semibold text-red-600">Admin</div>
                    <div>admin.demo</div>
                    <div>School2024</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="font-semibold text-green-600">Teacher</div>
                    <div>teacher.demo</div>
                    <div>School2024</div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="font-semibold text-blue-600">Student</div>
                    <div>student.demo</div>
                    <div>School2024</div>
                  </div>
                </div>
                <div className="mt-2">
                  <strong>How to login:</strong> Use "Username Login" tab → Enter username and password → Click "Sign in with Username"
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCredentialsGenerator;
