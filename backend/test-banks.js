require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function testBanks() {
  try {
    const key = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf8');
    const token = jwt.sign({ type: 'user', userId: 'd3012279-2bd7-4c26-8211-bc4fbd09ebc6' }, key, { algorithm: 'RS256' });
    
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
