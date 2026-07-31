const axios = require('axios');

async function testBanks() {
  try {
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'testuser_1784727308598@example.com',
      password: 'Password123!'
    });
    
    const token = loginRes.data.data.accessToken;
    
    const res = await axios.get('http://localhost:4000/api/payment/banks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data.success);
    console.log('Data length:', res.data.data ? res.data.data.length : 'undefined');
    if (res.data.data && res.data.data.length > 0) {
      console.log('First bank:', res.data.data[0]);
    }
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testBanks();
