require('dotenv').config();
const nodemailer = require('nodemailer');
const { buildSmtpTransportOptions } = require('./src/utils/emailService');

async function testEmail() {
  try {
    const options = buildSmtpTransportOptions();
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Not Set');
    console.log('SMTP_PORT:', options.port);
    console.log('SMTP_SECURE (implicit TLS):', options.secure);
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not Set');

    const transporter = nodemailer.createTransport(options);

    await transporter.verify();
    console.log('SMTP connection verified successfully!');
  } catch (error) {
    console.error('Error verifying SMTP connection:', error);
  }
}

testEmail();
