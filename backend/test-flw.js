require('dotenv').config();
const axios = require('axios');

async function testFlw() {
  try {
    console.log('Using secret key:', process.env.FLW_SECRET_KEY);
    const flwRes = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });
    console.log('Success!', flwRes.data.data.length, 'banks found');
  } catch (err) {
    console.error('Flutterwave Get Banks Error:', err.response?.data || err.message);
  }
}

testFlw();
