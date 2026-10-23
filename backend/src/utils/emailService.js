const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { enqueueOutbound, claimById, markSent, markRetryOrFailed } = require('../services/outboundQueue');

const BRAND = {
  blue:   '#0984E3',
  teal:   '#00CEC9',
  dark:   '#1E272E',
  darker: '#151D23',
  card:   '#232F38',
  light:  '#F5F6FA',
};

function wrapEmail(innerHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:${BRAND.card};border-radius:8px;overflow:hidden;">
      <div style="background-color:${BRAND.blue};background-image:linear-gradient(135deg,${BRAND.blue},${BRAND.teal});padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:1px;">ThinkTrophy</h1>
      </div>
      <div style="padding:32px 24px;background:${BRAND.light};">
        ${innerHtml}
      </div>
    </div>
  `;
}

function ctaStyle() {
  return `background-color:${BRAND.blue};background-image:linear-gradient(135deg,${BRAND.blue},${BRAND.teal});color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;`;
}

function mailFrom() {
  const raw = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  const bracketed = raw.match(/<([^>]+)>/);
  const bare = raw.match(/[^\s<>"]+@[^\s<>"]+/);
  const address = (bracketed?.[1] || bare?.[0] || raw).replace(/[<>"]/g, '').trim();
  return { name: 'ThinkTrophy', address };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

function emailIdempotency(to, subject, extra) {
  return crypto.createHash('sha256').update(`${to}|${subject}|${extra || ''}`).digest('hex').slice(0, 40);
}

function verifyUrlFor(token) {
  return `${process.env.APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendMailOrThrow({ to, subject, html, text }) {
  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject,
    html,
    text,
  });
}

async function deliverVerification({ to, username, token }) {
  const verifyUrl = verifyUrlFor(token);
  await sendMailOrThrow({
    to,
    subject: 'Verify your ThinkTrophy account',
    html: wrapEmail(`
            <h2 style="color:${BRAND.dark};margin-top:0;">Hi ${username}, welcome aboard!</h2>
            <p style="color:#555;line-height:1.6;">
              Thanks for registering. Click the button below to verify your email address and activate your account.
              This link expires in <strong>24 hours</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}" style="${ctaStyle()}">
                Verify Email Address
              </a>
            </div>
            <p style="color:#888;font-size:13px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
      `),
    text: `Hi ${username},\n\nVerify your ThinkTrophy account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, ignore this email.`,
  });
  console.log(`Verification email sent to ${to}`);
}

async function deliverPasswordReset({ to, name, otp }) {
  await sendMailOrThrow({
    to,
    subject: 'Reset your ThinkTrophy password',
    html: wrapEmail(`
            <h2 style="color:${BRAND.dark};margin-top:0;">Hi ${name},</h2>
            <p style="color:#555;line-height:1.6;">
              We received a request to reset the password for your ThinkTrophy account.
              Enter the following 6-digit code to reset your password:
            </p>
            <div style="text-align:center;margin:32px 0;">
              <span style="${ctaStyle()}font-size:24px;letter-spacing:4px;">
                ${otp}
              </span>
            </div>
            <p style="color:#555;line-height:1.6;">
              This code will expire in <strong>15 minutes</strong>.
            </p>
            <p style="color:#888;font-size:13px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
      `),
    text: `Hi ${name},\n\nYour password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
  });
  console.log(`Password reset email sent to ${to}`);
}

async function deliverAction({ to, name, subject, message }) {
  await sendMailOrThrow({
    to,
    subject,
    html: wrapEmail(`
            <h2 style="color:${BRAND.dark};margin-top:0;">Hi ${name},</h2>
            <p style="color:#555;line-height:1.6;font-size:16px;">
              ${message}
            </p>
            <p style="color:#888;font-size:13px;margin-top:32px;">
              If you did not authorize this action, please contact support immediately.
            </p>
      `),
    text: `Hi ${name},\n\n${message}\n\nIf you did not authorize this action, please contact support immediately.`,
  });
  console.log(`Action email '${subject}' sent to ${to}`);
}

async function enqueueEmail(jobName, payload, { priority, idempotencyKey, maxAttempts } = {}) {
  return enqueueOutbound({
    kind: 'email',
    jobName,
    payload,
    priority,
    idempotencyKey,
    maxAttempts,
  });
}

async function trySendNow(jobId, deliver) {
  if (!jobId) {
    await deliver();
    return;
  }
  const claimed = await claimById(jobId);
  if (!claimed) return;
  try {
    await deliver();
    await markSent(claimed.id);
  } catch (error) {
    await markRetryOrFailed(claimed, error.message);
    throw error;
  }
}

async function sendVerificationEmail(to, username, token) {
  const verifyUrl = verifyUrlFor(token);
  const payload = { to, username, token };
  let jobId = null;
  try {
    jobId = await enqueueEmail('verification', payload, {
      priority: 10,
      idempotencyKey: emailIdempotency(to, 'verification', token),
    });
    await trySendNow(jobId, () => deliverVerification(payload));
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Verification URL: ${verifyUrl}`);
    }
  }
}

async function sendPasswordResetEmail(to, name, otp) {
  const payload = { to, name, otp };
  try {
    const jobId = await enqueueEmail('password_reset', payload, {
      priority: 10,
      maxAttempts: 4,
      idempotencyKey: emailIdempotency(to, 'password_reset', otp),
    });
    await trySendNow(jobId, () => deliverPasswordReset(payload));
  } catch (error) {
    console.error(`Failed to send password reset email to ${to}:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Password reset OTP: ${otp}`);
    }
  }
}

async function sendActionEmail(to, name, subject, message) {
  try {
    await enqueueEmail('action', { to, name, subject, message }, {
      priority: 80,
      idempotencyKey: emailIdempotency(to, subject, message),
    });
  } catch (error) {
    console.error(`Failed to queue action email '${subject}' to ${to}:`, error.message);
  }
}

function jobAgeMs(job) {
  if (!job?.created_at) return 0;
  return Date.now() - new Date(job.created_at).getTime();
}

function expiredError(message) {
  const err = new Error(message);
  err.permanent = true;
  return err;
}

async function executeEmailJob(jobName, payload = {}, job = {}) {
  if (jobName === 'password_reset' && jobAgeMs(job) > 15 * 60 * 1000) {
    throw expiredError('Password reset code expired');
  }
  if (jobName === 'verification' && jobAgeMs(job) > 24 * 60 * 60 * 1000) {
    throw expiredError('Verification link expired');
  }

  if (jobName === 'verification') return deliverVerification(payload);
  if (jobName === 'password_reset') return deliverPasswordReset(payload);
  if (jobName === 'action') return deliverAction(payload);
  throw new Error(`Unknown email job: ${jobName}`);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendActionEmail,
  executeEmailJob,
};
