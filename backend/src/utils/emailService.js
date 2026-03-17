const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(to, username, token) {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ThinkTrophy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your ThinkTrophy account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden;">
        <div style="background:#1a1a2e;padding:32px 24px;text-align:center;">
          <h1 style="color:#e94560;margin:0;font-size:28px;letter-spacing:1px;">ThinkTrophy</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1a1a2e;margin-top:0;">Hi ${username}, welcome aboard!</h2>
          <p style="color:#555;line-height:1.6;">
            Thanks for registering. Click the button below to verify your email address and activate your account.
            This link expires in <strong>24 hours</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}"
               style="background:#e94560;color:#fff;padding:14px 32px;border-radius:6px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color:#888;font-size:13px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color:#aaa;font-size:12px;word-break:break-all;">
            Or copy this link into your browser:<br/>${verifyUrl}
          </p>
        </div>
      </div>
    `,
    text: `Hi ${username},\n\nVerify your ThinkTrophy account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, ignore this email.`,
  });
}

module.exports = { sendVerificationEmail };
