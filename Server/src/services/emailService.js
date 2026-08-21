const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const sendResetPasscodeEmail = async (toEmail, code) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"LEETPULSE Academic Platform" <noreply@leetpulse.com>',
    to: toEmail,
    subject: '🔑 LEETPULSE - Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px;">
          <h2 style="color: #6366f1; margin-top: 0;">LEETPULSE Password Reset</h2>
          <p style="color: #cbd5e1; font-size: 14px;">You requested a password reset for your account (<strong>${toEmail}</strong>).</p>
          <div style="margin: 24px 0; text-align: center; background-color: #0f172a; border: 1px solid #475569; padding: 16px; border-radius: 12px;">
            <span style="font-size: 12px; color: #94a3b8; display: block; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #818cf8; letter-spacing: 6px;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This verification code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">LEETPULSE Academic & Placement Platform</p>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`⚠️ SMTP CREDENTIALS NOT SET IN Server/.env`);
    console.log(`------------------------------------------------------`);
    console.log(`Target Email: ${toEmail}`);
    console.log(`6-Digit Code: ${code}`);
    console.log(`To deliver real emails, add SMTP_USER & SMTP_PASS to Server/.env`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'SMTP credentials not configured in Server/.env' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Password reset email sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

module.exports = {
  sendResetPasscodeEmail
};
