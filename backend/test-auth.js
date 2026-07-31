const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testAuth() {
  try {
    console.log('--- Testing Authentication Logic ---');
    const timestamp = Date.now();
    const testUser = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      password: 'Password123!',
      phone_number: `+1555${timestamp.toString().slice(-7)}`,
      first_name: 'Test',
      last_name: 'User',
      dob: '1990-01-01'
    };

    // 1. Register
    console.log(`\n1. Registering user: ${testUser.username}`);
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('Register Response:', registerRes.data);

    // 2. Login
    console.log(`\n2. Logging in user: ${testUser.email}`);
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('Login Response:', loginRes.data);

    const { accessToken, refreshToken } = loginRes.data.data;
    
    // 3. Get User Profile (to test access token)
    console.log('\n3. Getting user profile with access token');
    const profileRes = await axios.get(`${API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Profile Response:', profileRes.data);

    // 4. Refresh Token
    console.log('\n4. Refreshing token');
    const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    console.log('Refresh Response:', refreshRes.data);
    
    const newAccessToken = refreshRes.data.data.accessToken;

    // 5. Logout
    console.log('\n5. Logging out');
    const logoutRes = await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    console.log('Logout Response:', logoutRes.data);

    console.log('\n--- All authentication tests passed! ---');
  } catch (error) {
    console.error('\n--- Test Failed ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testAuth();
