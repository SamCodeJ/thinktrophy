require('dotenv').config();
const { sendActionEmail } = require('./src/utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Not Set');
    console.log('SMTP_PORT:', process.env.SMTP_PORT ? 'Set' : 'Not Set');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not Set');
    
    // We can try to send an email to a dummy address or just check the transporter connection
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    console.log('SMTP connection verified successfully!');
  } catch (error) {
    console.error('Error verifying SMTP connection:', error);
  }
}

testEmail();
