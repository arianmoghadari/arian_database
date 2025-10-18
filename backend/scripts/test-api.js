#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  fullName: 'کاربر تست',
  email: 'test@example.com',
  password: 'test123456'
};

const testCity = {
  name: 'شهر تست',
  slug: 'test-city',
  status: 'active'
};

const testPartner = {
  name: 'شریک تست',
  contactInfo: 'اطلاعات تماس تست',
  status: 'active'
};

let authToken = '';

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

async function testAuth() {
  console.log('🔐 Testing Authentication...');
  
  // Test registration
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    console.log('✅ User registration successful');
    authToken = registerResult.data.token;
  } else {
    console.log('⚠️  Registration failed (user might exist):', registerResult.error);
    
    // Try login instead
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResult.success) {
      console.log('✅ User login successful');
      authToken = loginResult.data.token;
    } else {
      console.log('❌ Login failed:', loginResult.error);
      return false;
    }
  }
  
  // Test /me endpoint
  const meResult = await makeRequest('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (meResult.success) {
    console.log('✅ /auth/me endpoint working');
  } else {
    console.log('❌ /auth/me failed:', meResult.error);
  }
  
  return true;
}

async function testCities() {
  console.log('🏙️  Testing Cities...');
  
  // Test get cities
  const getResult = await makeRequest('GET', '/cities');
  if (getResult.success) {
    console.log('✅ GET /cities working');
  } else {
    console.log('❌ GET /cities failed:', getResult.error);
  }
  
  // Test create city (admin only)
  const createResult = await makeRequest('POST', '/cities', testCity, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (createResult.success) {
    console.log('✅ POST /cities working');
  } else {
    console.log('⚠️  POST /cities failed (might need admin role):', createResult.error);
  }
}

async function testBillboards() {
  console.log('📺 Testing Billboards...');
  
  // Test get billboards
  const getResult = await makeRequest('GET', '/billboards');
  if (getResult.success) {
    console.log('✅ GET /billboards working');
    console.log(`   Found ${getResult.data.items.length} billboards`);
  } else {
    console.log('❌ GET /billboards failed:', getResult.error);
  }
  
  // Test billboards with filters
  const filterResult = await makeRequest('GET', '/billboards?search=تهران&labels=available&page=1&limit=5');
  if (filterResult.success) {
    console.log('✅ GET /billboards with filters working');
  } else {
    console.log('❌ GET /billboards with filters failed:', filterResult.error);
  }
}

async function testAdmin() {
  console.log('👑 Testing Admin Endpoints...');
  
  // Test admin stats
  const statsResult = await makeRequest('GET', '/admin/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (statsResult.success) {
    console.log('✅ GET /admin/stats working');
  } else {
    console.log('⚠️  GET /admin/stats failed (might need admin role):', statsResult.error);
  }
  
  // Test health check
  const healthResult = await makeRequest('GET', '/admin/health', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (healthResult.success) {
    console.log('✅ GET /admin/health working');
  } else {
    console.log('⚠️  GET /admin/health failed (might need admin role):', healthResult.error);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    const authSuccess = await testAuth();
    if (!authSuccess) {
      console.log('❌ Authentication tests failed, stopping...');
      return;
    }
    
    console.log('');
    await testCities();
    console.log('');
    await testBillboards();
    console.log('');
    await testAdmin();
    
    console.log('\n🎉 API tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
