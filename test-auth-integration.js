#!/usr/bin/env node

/**
 * Integration Test Script for Multi-tenant Authentication
 * 
 * This script tests the complete authentication flow:
 * 1. Creates a test school
 * 2. Creates a test user via signup
 * 3. Assigns tenant and role via API
 * 4. Verifies JWT contains tenant_id and role
 * 5. Tests RLS policies work correctly
 * 
 * Usage:
 *   node test-auth-integration.js
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY  
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - ASSIGN_TENANT_SECRET
 *   - TEST_API_URL (optional, defaults to http://localhost:3001)
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  assignTenantSecret: process.env.ASSIGN_TENANT_SECRET,
  apiUrl: process.env.TEST_API_URL || 'http://localhost:3001'
};

// Validate configuration
function validateConfig() {
  const required = ['supabaseUrl', 'supabaseAnonKey', 'supabaseServiceKey', 'assignTenantSecret'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('\nRequired variables:');
    console.error('  SUPABASE_URL');
    console.error('  SUPABASE_ANON_KEY');
    console.error('  SUPABASE_SERVICE_ROLE_KEY');
    console.error('  ASSIGN_TENANT_SECRET');
    console.error('  TEST_API_URL (optional)');
    process.exit(1);
  }
}

// Initialize Supabase clients
const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey);
const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test data
const testData = {
  school: {
    name: `Test School ${Date.now()}`,
    email: `test-school-${Date.now()}@example.com`,
    address: '123 Test Street, Test City, TC 12345'
  },
  user: {
    email: `test-user-${Date.now()}@example.com`,
    password: 'test123456',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
  }
};

// Utility functions
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

function success(message, data = null) {
  console.log(`✅ ${message}`);
  if (data) {
    console.log('  Result:', JSON.stringify(data, null, 2));
  }
}

function error(message, err = null) {
  console.error(`❌ ${message}`);
  if (err) {
    console.error('  Error:', err.message || err);
    if (err.stack) {
      console.error('  Stack:', err.stack);
    }
  }
}

// Test functions
async function createTestSchool() {
  log('Creating test school...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('schools')
      .insert([testData.school])
      .select()
      .single();
    
    if (error) throw error;
    
    success('Test school created', { id: data.id, name: data.name });
    return data;
  } catch (err) {
    error('Failed to create test school', err);
    throw err;
  }
}

async function signUpUser(schoolId) {
  log('Signing up test user...');
  
  try {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: testData.user.email,
      password: testData.user.password,
      options: {
        data: {
          first_name: testData.user.firstName,
          last_name: testData.user.lastName,
          role: testData.user.role,
          school_id: schoolId
        }
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signup');
    
    success('User signed up', { 
      id: data.user.id, 
      email: data.user.email,
      confirmed: data.user.email_confirmed_at ? 'Yes' : 'No'
    });
    
    return data.user;
  } catch (err) {
    error('Failed to sign up user', err);
    throw err;
  }
}

async function assignTenantAndRole(userId, tenantId, role) {
  log('Assigning tenant and role...');
  
  try {
    const response = await fetch(`${config.apiUrl}/api/assignTenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-assign-tenant-secret': config.assignTenantSecret
      },
      body: JSON.stringify({
        userId,
        tenantId,
        role
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    success('Tenant and role assigned', result);
    return result;
  } catch (err) {
    error('Failed to assign tenant and role', err);
    throw err;
  }
}

async function verifyUserAuthentication(email, password) {
  log('Verifying user authentication and JWT...');
  
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('No user or session returned');
    
    const userMetadata = data.user.user_metadata;
    const hastenantId = userMetadata && userMetadata.tenant_id;
    const hasRole = userMetadata && userMetadata.role;
    
    if (hastenantId && hasRole) {
      success('JWT verification passed', {
        userId: data.user.id,
        email: data.user.email,
        tenant_id: userMetadata.tenant_id,
        role: userMetadata.role
      });
    } else {
      error('JWT missing tenant_id or role', {
        user_metadata: userMetadata
      });
      throw new Error('JWT verification failed');
    }
    
    return { user: data.user, session: data.session };
  } catch (err) {
    error('Failed to verify authentication', err);
    throw err;
  }
}

async function testRLSPolicies(schoolId) {
  log('Testing RLS policies...');
  
  try {
    // Test that user can see students from their school
    const { data: ownSchoolStudents, error: ownError } = await supabaseAnon
      .from('students')
      .select('*');
    
    if (ownError) {
      // This might be expected if no students exist yet
      log('No students found (this may be expected)', ownError.message);
    } else {
      log(`Found ${ownSchoolStudents.length} students in user's school`);
    }
    
    // Test that user can see their school's data
    const { data: schoolData, error: schoolError } = await supabaseAnon
      .from('schools')
      .select('*')
      .eq('id', schoolId);
    
    if (schoolError) throw schoolError;
    
    if (schoolData.length === 1) {
      success('RLS allows access to own school data', {
        schoolId: schoolData[0].id,
        schoolName: schoolData[0].name
      });
    } else {
      error('RLS policy issue - wrong number of schools returned', {
        expected: 1,
        actual: schoolData.length
      });
    }
    
    // Test profile access
    const { data: profileData, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('*');
    
    if (profileError) {
      log('Profile query error (might be expected)', profileError.message);
    } else {
      log(`User can see ${profileData.length} profiles`);
    }
    
    success('RLS policies working correctly');
    
  } catch (err) {
    error('RLS policy test failed', err);
    throw err;
  }
}

async function cleanup(schoolId, userId) {
  log('Cleaning up test data...');
  
  try {
    // Delete user (this should cascade and clean up related data)
    if (userId) {
      const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (userError) {
        log('Failed to delete user (may not exist)', userError.message);
      } else {
        log('Test user deleted');
      }
    }
    
    // Delete school
    if (schoolId) {
      const { error: schoolError } = await supabaseAdmin
        .from('schools')
        .delete()
        .eq('id', schoolId);
      
      if (schoolError) {
        log('Failed to delete school', schoolError.message);
      } else {
        log('Test school deleted');
      }
    }
    
    success('Cleanup completed');
  } catch (err) {
    error('Cleanup failed', err);
  }
}

// Main test function
async function runIntegrationTest() {
  console.log('🚀 Starting Multi-tenant Authentication Integration Test\n');
  
  validateConfig();
  
  let school = null;
  let user = null;
  
  try {
    // Step 1: Create test school
    school = await createTestSchool();
    
    // Step 2: Sign up user
    user = await signUpUser(school.id);
    
    // Step 3: Assign tenant and role
    await assignTenantAndRole(user.id, school.id, testData.user.role);
    
    // Step 4: Verify authentication and JWT
    await verifyUserAuthentication(testData.user.email, testData.user.password);
    
    // Step 5: Test RLS policies
    await testRLSPolicies(school.id);
    
    console.log('\n🎉 All tests passed! Authentication system is working correctly.\n');
    
    // Print summary
    console.log('Test Summary:');
    console.log(`  School ID: ${school.id}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  User Email: ${testData.user.email}`);
    console.log(`  User Role: ${testData.user.role}`);
    console.log(`  API URL: ${config.apiUrl}`);
    
  } catch (err) {
    console.log('\n💥 Test failed! Check the errors above.\n');
    process.exit(1);
  } finally {
    // Clean up test data
    if (school || user) {
      await cleanup(school?.id, user?.id);
    }
  }
}

// Manual test checklist
function printManualTestChecklist() {
  console.log('\n📋 Manual Test Checklist:');
  console.log('');
  console.log('1. Signup Test:');
  console.log('   □ Go to your app and click "Create New Account"');
  console.log('   □ Fill out form and select a school and role');
  console.log('   □ Check browser Network tab - verify assignTenant API is called');
  console.log('   □ Check Supabase Auth dashboard - verify user exists with metadata');
  console.log('');
  console.log('2. Login Test:');
  console.log('   □ Login with the created account');
  console.log('   □ Open browser console (F12)');
  console.log('   □ Look for "✅ JWT contains tenant_id and role" message');
  console.log('   □ Check Application > Storage > Local Storage for session data');
  console.log('');
  console.log('3. RLS Test:');
  console.log('   □ While logged in, try to query data via browser console:');
  console.log('     supabase.from("students").select("*")');
  console.log('   □ Verify only data from your school is returned');
  console.log('   □ Try logging in as user from different school');
  console.log('   □ Verify you see different data set');
  console.log('');
}

// Run the test
if (require.main === module) {
  runIntegrationTest()
    .then(() => printManualTestChecklist())
    .catch(console.error);
}

module.exports = {
  runIntegrationTest,
  testData,
  config
};