#!/usr/bin/env node

/**
 * Profile API Test Script
 *
 * Tests the coach profiles API endpoints to ensure they work correctly
 * Run with: node scripts/test-profiles.js
 *
 * Prerequisites:
 * - Server must be running on http://localhost:8787
 * - Supabase must be configured
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dltscjplwbvtlgguwsbb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHNjanBsd2J2dGxnZ3V3c2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjU0NzgsImV4cCI6MjA3NTAwMTQ3OH0.-d2tfOD7N5QgWhJOSpPsti4nF2vp2Nx_4IkZMVsfGKY';
const API_URL = process.env.VITE_API_URL || 'http://localhost:8787';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let testUser = null;
let testToken = null;
let testsPassed = 0;
let testsFailed = 0;

function log(emoji, message, details = '') {
  console.log(`${emoji} ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function pass(testName) {
  testsPassed++;
  log('✅', `PASS: ${testName}`);
}

function fail(testName, error) {
  testsFailed++;
  log('❌', `FAIL: ${testName}`, error);
}

async function testServerHealth() {
  console.log('\n🔍 Testing server health...');
  try {
    const response = await fetch(`${API_URL}/api/healthz`);
    if (response.ok) {
      pass('Server health check');
    } else {
      fail('Server health check', `Status: ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    fail('Server health check', error.message);
    console.log('\n💡 Make sure the server is running: npm run server:dev');
    process.exit(1);
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing authentication...');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Test signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signupError) {
      fail('User signup', signupError.message);
      return false;
    }

    testUser = signupData.user;
    testToken = signupData.session?.access_token;

    if (!testUser || !testToken) {
      fail('User signup', 'No user or token returned');
      return false;
    }

    pass('User signup');
    log('ℹ️', `Created test user: ${testEmail}`);

    return true;
  } catch (error) {
    fail('Authentication', error.message);
    return false;
  }
}

async function testGetMyProfile() {
  console.log('\n📋 Testing GET /api/coach-profiles/me...');

  try {
    const response = await fetch(`${API_URL}/api/coach-profiles/me`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      fail('GET my profile', `${response.status}: ${data.error}`);
      return null;
    }

    pass('GET my profile');
    log('ℹ️', `Profile data: ${data.profile ? 'exists' : 'null (not created yet)'}`);
    return data.profile;
  } catch (error) {
    fail('GET my profile', error.message);
    return null;
  }
}

async function testCreateProfile() {
  console.log('\n📝 Testing POST /api/coach-profiles...');

  const profileData = {
    email: testUser.email,
    first_name: 'Test',
    last_name: 'Coach',
    title: 'Tennis Coach',
    bio: 'Test bio for automated testing',
    location: 'Test City',
    years_experience: 5,
    sports: ['Tennis'],
    levels: ['Beginner', 'Intermediate']
  };

  try {
    const response = await fetch(`${API_URL}/api/coach-profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      fail('POST create profile', `${response.status}: ${data.error}`);
      return null;
    }

    pass('POST create profile');
    log('ℹ️', `Created profile for: ${data.profile.first_name} ${data.profile.last_name}`);
    return data.profile;
  } catch (error) {
    fail('POST create profile', error.message);
    return null;
  }
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing PUT /api/coach-profiles/me...');

  const updates = {
    title: 'Senior Tennis Coach',
    bio: 'Updated bio for testing',
    years_experience: 10
  };

  try {
    const response = await fetch(`${API_URL}/api/coach-profiles/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      fail('PUT update profile', `${response.status}: ${data.error}`);
      return null;
    }

    pass('PUT update profile');
    log('ℹ️', `Updated title to: ${data.profile.title}`);
    return data.profile;
  } catch (error) {
    fail('PUT update profile', error.message);
    return null;
  }
}

async function testCheckProfile() {
  console.log('\n🔍 Testing GET /api/coach-profiles/check/:userId...');

  try {
    const response = await fetch(`${API_URL}/api/coach-profiles/check/${testUser.id}`);
    const data = await response.json();

    if (!response.ok) {
      fail('GET check profile', `${response.status}: ${data.error}`);
      return null;
    }

    pass('GET check profile');
    log('ℹ️', `Found profile: ${data.profile ? 'yes' : 'no'}`);
    return data.profile;
  } catch (error) {
    fail('GET check profile', error.message);
    return null;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🔒 Testing Row Level Security...');

  // Test 1: GET without auth
  try {
    const response = await fetch(`${API_URL}/api/coach-profiles/me`);
    if (response.status === 401) {
      pass('Block unauthenticated GET');
    } else {
      fail('Block unauthenticated GET', `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail('Block unauthenticated GET', error.message);
  }

  // Test 2: POST without auth
  try {
    const response = await fetch(`${API_URL}/api/coach-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hacker@test.com',
        first_name: 'Hack',
        last_name: 'Er'
      })
    });
    if (response.status === 401) {
      pass('Block unauthenticated POST');
    } else {
      fail('Block unauthenticated POST', `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail('Block unauthenticated POST', error.message);
  }

  // Test 3: PUT without auth
  try {
    const response = await fetch(`${API_URL}/api/coach-profiles/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacker' })
    });
    if (response.status === 401) {
      pass('Block unauthenticated PUT');
    } else {
      fail('Block unauthenticated PUT', `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    fail('Block unauthenticated PUT', error.message);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Sign out
    await supabase.auth.signOut();
    log('ℹ️', 'Test user signed out');
  } catch (error) {
    log('⚠️', 'Cleanup warning', error.message);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Profile API Test Suite');
  console.log('='.repeat(60));

  try {
    // 1. Server health
    await testServerHealth();

    // 2. Authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed, cannot continue tests');
      process.exit(1);
    }

    // 3. Profile operations
    await testGetMyProfile();
    const profile = await testCreateProfile();

    if (profile) {
      await testUpdateProfile();
      await testCheckProfile();
    }

    // 4. Security tests
    await testUnauthorizedAccess();

    // 5. Cleanup
    await cleanup();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
