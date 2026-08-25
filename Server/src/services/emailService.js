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

const sendPendingApprovalNotificationEmail = async ({ toEmail, approverRole, applicantName, applicantEmail, applicantRole, departmentName, institutionName }) => {
  const transporter = createTransporter();

  const roleTitle = applicantRole === 'hod' ? 'Head of Department (HOD)' : 'Faculty / Staff Instructor';

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"LEETPULSE Academic Platform" <noreply@leetpulse.com>',
    to: toEmail,
    subject: `📩 Pending Role Approval Request: ${applicantName} (${applicantRole.toUpperCase()})`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 30px;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px;">
          <h2 style="color: #6366f1; margin-top: 0;">LEETPULSE Role Approval Request</h2>
          <p style="color: #cbd5e1; font-size: 14px;">Hello <strong>${approverRole}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px;">A new account has registered on LEETPULSE and requires your approval:</p>
          
          <div style="margin: 20px 0; background-color: #0f172a; border: 1px solid #475569; padding: 18px; border-radius: 12px; font-size: 13px; color: #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Applicant Name:</strong> ${applicantName}</p>
            <p style="margin: 4px 0;"><strong>Email Address:</strong> ${applicantEmail}</p>
            <p style="margin: 4px 0;"><strong>Requested Role:</strong> <span style="color: #818cf8; font-weight: bold;">${roleTitle}</span></p>
            <p style="margin: 4px 0;"><strong>Department:</strong> ${departmentName || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Institution:</strong> ${institutionName || 'LEETPULSE Platform'}</p>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">Please log in to your LEETPULSE Dashboard to review and <strong>Grant Approval</strong> or Reject this registration.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">LEETPULSE Academic Governance System</p>
        </div>
      </div>
    `
  };

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📩 PENDING APPROVAL NOTIFICATION EMAIL GENERATED`);
    console.log(`------------------------------------------------------`);
    console.log(`To:             ${toEmail} (${approverRole})`);
    console.log(`Applicant:      ${applicantName} <${applicantEmail}>`);
    console.log(`Requested Role: ${applicantRole}`);
    console.log(`Department:     ${departmentName || 'N/A'}`);
    console.log(`Institution:    ${institutionName || 'LEETPULSE'}`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'SMTP credentials not configured in Server/.env' };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Pending approval notification email sent to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send notification email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
};

module.exports = {
  sendResetPasscodeEmail,
  sendPendingApprovalNotificationEmail
};
