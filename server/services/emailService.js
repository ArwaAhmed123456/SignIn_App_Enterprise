/**
 * emailService.js
 * Uses Resend API - works on Render without SMTP port blocking.
 * Free tier: 100 emails/day, 3000/month to verified email only.
 * 
 * For production: verify domain at resend.com/domains to send to anyone.
 * For testing: emails only go to the account owner's verified email.
 */
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    // Do not leave the user waiting on an unavailable SMTP host. A transactional
    // API fallback is attempted promptly when the SMTP connection is unhealthy.
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — Resend will not be available as a fallback');
    return null;
  }
  return new Resend(apiKey);
};

// From address — set EMAIL_FROM env var to your verified Resend domain address
// e.g. EMAIL_FROM="Tripod Services <Abid.fiaz@tripodsvcs.co.uk>"
// Falls back to Resend's shared domain for testing only (sends to verified email only)
const FROM = process.env.EMAIL_FROM
  ? process.env.EMAIL_FROM
  : 'Sign In App <onboarding@resend.dev>';

// ── Core send function ────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  // Resend is a transactional provider and is normally faster/more reliable for
  // delivery than opening an SMTP connection on every request. Set
  // EMAIL_PROVIDER=smtp to force SMTP where that is required.
  const transporter = (process.env.EMAIL_PROVIDER === 'smtp' || !process.env.RESEND_API_KEY)
    ? getSmtpTransporter()
    : null;
  if (transporter) {
    try {
      console.log(`[SMTP] Attempting to send email to ${to} via SMTP...`);
      const info = await transporter.sendMail({
        from: FROM,
        to,
        subject,
        html,
        replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || undefined,
      });
      console.log(`✓ Email sent to ${to} via SMTP — messageId: ${info.messageId}`);
      return { success: true, id: info.messageId };
    } catch (smtpErr) {
      console.error('[SMTP] Error sending email, falling back to Resend:', smtpErr.message);
    }
  }

  const resend = getResend();
  if (!resend) return { success: false, error: 'Neither SMTP nor Resend configured' };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      reply_to: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || undefined,
    });
    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message || JSON.stringify(error) };
    }
    console.log(`✓ Email sent to ${to} via Resend — id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email exception:', err.message);
    return { success: false, error: err.message };
  }
};

// ── Password reset ────────────────────────────────────────────────────────────
const generateResetToken = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendPasswordResetEmail = async (email, projectName, resetToken) =>
  sendMail({
    to: email,
    subject: `Password Reset — ${projectName}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
  <h2 style="color:#2b4594;margin:0 0 16px;">Password Reset</h2>
  <p style="color:#374151;">Reset code for <strong>${projectName}</strong>:</p>
  <div style="background:#f0f4ff;border:2px solid #2b4594;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
    <div style="font-size:38px;font-weight:900;color:#2b4594;letter-spacing:8px;font-family:'Courier New',monospace;">${resetToken}</div>
  </div>
  <p style="color:#6b7280;font-size:13px;">Expires in 15 minutes.</p>
</div>`,
  });

// ── Contact email ─────────────────────────────────────────────────────────────
const sendContactEmail = async (userEmail, query) =>
  sendMail({
    to: process.env.EMAIL_USER || 'Abid.fiaz@tripodsvcs.co.uk',
    subject: `New query from ${userEmail}`,
    html: `<div style="font-family:Arial,sans-serif;padding:20px;"><h3>From: ${userEmail}</h3><p style="white-space:pre-wrap;">${query}</p></div>`,
  });

// ── Pre-registration invite ───────────────────────────────────────────────────
const sendPreRegistrationInviteEmail = async ({ email, name, siteName, expectedDate, notes }) => {
  const visitLabel = expectedDate
    ? new Date(expectedDate).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : 'a scheduled visit';
  return sendMail({
    to: email,
    subject: `Your visit to ${siteName || 'our site'}`,
    html: `
<div style="font-family:Arial,sans-serif;padding:24px;border:1px solid #e5e7eb;border-radius:12px;max-width:520px;">
  <h2 style="color:#2b4594;">Visit invitation</h2>
  <p>Hello <strong>${name || 'visitor'}</strong>,</p>
  <p>You have been pre-registered for a visit at <strong>${siteName || 'our site'}</strong>.</p>
  <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;">
    <p style="margin:0;"><strong>Expected arrival:</strong> ${visitLabel}</p>
    ${notes ? `<p style="margin:8px 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
  </div>
</div>`,
  });
};

// ── Mobile activation email ───────────────────────────────────────────────────
const sendMobileInviteEmail = async (guard, plainToken) => {
  const formatted = `${plainToken.slice(0,4)}-${plainToken.slice(4,8)}-${plainToken.slice(8,12)}`;
  return sendMail({
    to: guard.email,
    subject: `Your mobile activation code — Sign In App`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
  <h2 style="color:#2b4594;">Mobile App Activation</h2>
  <p>Hi <strong>${guard.name}</strong>, here is your activation code:</p>
  <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
    <div style="font-size:34px;font-weight:900;color:#4ade80;letter-spacing:6px;font-family:'Courier New',monospace;">${formatted}</div>
    <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">Expires in 72 hours · one-time use</p>
  </div>
  <p style="color:#6b7280;font-size:13px;">Open the companion app → tap <strong>Get started</strong> → enter this code.</p>
</div>`,
  });
};

// ── Welcome email (matches Sign In App reference) ─────────────────────────────
const sendWelcomeEmail = async ({ email, name, groupName, siteName, orgName, companionCode }) => {
  const qrValue  = `MEMBER:${email}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}&color=0f172a&bgcolor=ffffff&qzone=2`;
  const fmtCode  = companionCode
    ? `${companionCode.slice(0,4)}-${companionCode.slice(4,8)}-${companionCode.slice(8,12)}`
    : null;

  const companionSection = fmtCode ? `
    <tr><td style="padding:0 40px 32px;">
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>
      <h2 style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 8px;">Companion app</h2>
      <p style="color:#475569;font-size:14px;margin:0 0 20px;">Sign in and out from your phone using the companion app.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tbody>
        <tr><td style="width:28px;vertical-align:top;padding-top:2px;">
          <div style="width:26px;height:26px;border-radius:50%;background:#2b4594;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:26px;">1</div>
        </td><td style="padding-left:12px;padding-bottom:14px;font-size:14px;color:#374151;">
          <strong>Download</strong> the Sign In companion app:
          <br/><a href="https://apps.apple.com/app/sign-in-companion" style="color:#2b4594;text-decoration:none;">App Store</a> or 
          <a href="https://play.google.com/store/apps/details?id=com.signinapp.companion" style="color:#2b4594;text-decoration:none;">Play Store</a>
        </td></tr>
        <tr><td style="width:28px;vertical-align:top;padding-top:2px;">
          <div style="width:26px;height:26px;border-radius:50%;background:#2b4594;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:26px;">2</div>
        </td><td style="padding-left:12px;padding-bottom:14px;font-size:14px;color:#374151;">
          <strong>Enter your 12-digit code</strong> below and tap Connect.
        </td></tr>
        <tr><td style="width:28px;vertical-align:top;padding-top:2px;">
          <div style="width:26px;height:26px;border-radius:50%;background:#2b4594;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:26px;">3</div>
        </td><td style="padding-left:12px;font-size:14px;color:#374151;">
          <strong>Done!</strong> You are ready to sign in from your phone.
        </td></tr>
      </tbody></table>
      <p style="font-size:13px;color:#6b7280;margin:20px 0 10px;">Your companion app code (valid 72 hours):</p>
      <div style="background:#0f172a;border-radius:12px;padding:22px;text-align:center;">
        <div style="font-size:32px;font-weight:900;color:#4ade80;letter-spacing:6px;font-family:'Courier New',monospace;">${fmtCode}</div>
        <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">One-time use · expires in 72 hours</p>
      </div>
    </td></tr>` : '';

  return sendMail({
    to: email,
    subject: `Welcome${groupName ? ` to ${groupName}` : ''} — ${orgName || siteName || 'Sign In App'}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td align="center" style="padding:32px 16px 40px;">
<table width="100%" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);" cellpadding="0" cellspacing="0"><tbody>
  <tr><td style="background:#2b4594;height:6px;"></td></tr>
  <tr><td style="padding:40px 40px 24px;">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;">Welcome${name ? `, ${name}` : ''}!</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0;">
      Dear <strong>${name || 'Member'}</strong>, you have been registered as a member of the
      <strong>${groupName || 'Employees'}</strong> group at
      <strong>${orgName || siteName || 'our organisation'}</strong>.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px 32px;">
    <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:24px;text-align:center;">
      <h2 style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 8px;">Scan your QR code on arrival</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Show this QR code at the reception iPad to sign in quickly.</p>
      <img src="${qrImgUrl}" width="160" height="160" alt="Your QR Code" style="border-radius:10px;border:1px solid #e2e8f0;display:block;margin:0 auto;"/>
    </div>
  </td></tr>
  ${companionSection}
  <tr><td style="padding:0 40px 32px;">
    <div style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:18px 20px;">
      <p style="color:#166534;font-size:14px;margin:0;"><strong>✅ You are all set!</strong> Please don't delete this email. When you arrive, scan the QR code above. We look forward to seeing you!</p>
    </div>
  </td></tr>
  <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f3f4f6;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">Powered by <strong>Sign In App</strong> · ${orgName || siteName || 'Tripod Services'}</p>
  </td></tr>
</tbody></table>
</td></tr></tbody></table>
</body>
</html>`,
  });
};

// ── Admin credentials email ───────────────────────────────────────────────────
const sendAdminCredentialsEmail = async ({ email, firstName, tempPassword, role }) => {
  const roleLabel = role === 'superadmin' ? 'Super Admin' : 'Admin';
  return sendMail({
    to: email,
    subject: `Your Sign In App portal account has been created`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td align="center" style="padding:32px 16px 40px;">
<table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);" cellpadding="0" cellspacing="0"><tbody>
  <tr><td style="background:#2b4594;height:6px;"></td></tr>
  <tr><td style="padding:36px 40px 24px;">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;">Your portal account is ready</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0;">
      Hi <strong>${firstName || email.split('@')[0]}</strong>, a <strong>${roleLabel}</strong> account has been created for you on the Sign In App portal.
    </p>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <div style="background:#f0f4ff;border:1.5px solid #c7d7fe;border-radius:12px;padding:24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Login credentials</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong>Login URL:</strong></td><td style="padding:6px 0;font-size:14px;"><a href="${process.env.APP_URL || 'https://tripod-signin-app.onrender.com'}/admin/login" style="color:#2b4594;text-decoration:none;">${(process.env.APP_URL || 'https://tripod-signin-app.onrender.com').replace('https://','')}</a></td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong>Email:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${email.toLowerCase()}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong>Password:</strong></td><td style="padding:6px 0;"><span style="font-family:'Courier New',monospace;font-size:18px;font-weight:900;color:#2b4594;background:#e8eeff;padding:4px 10px;border-radius:6px;">${tempPassword}</span></td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong>Role:</strong></td><td style="padding:6px 0;font-size:14px;color:#111827;">${roleLabel}</td></tr>
      </table>
    </div>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <div style="background:#fef9ec;border-radius:10px;border:1px solid #fde68a;padding:16px 20px;">
      <p style="color:#92400e;font-size:14px;margin:0;"><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
    </div>
  </td></tr>
  <tr><td style="padding:16px 40px 28px;text-align:center;border-top:1px solid #f3f4f6;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">Powered by <strong>Sign In App</strong> · Tripod Services</p>
  </td></tr>
</tbody></table>
</td></tr></tbody></table>
</body>
</html>`,
  });
};

// ── Visitor arrival notification (to host/manager) ───────────────────────────
const sendVisitorArrivalNotificationEmail = async ({ hostEmail, hostName, visitorName, siteName, arrivalTime }) => {
  const timeLabel = arrivalTime
    ? new Date(arrivalTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'just now';
  return sendMail({
    to: hostEmail,
    subject: `Your visitor ${visitorName} has arrived — ${siteName || 'Sign In App'}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
  <div style="background:#2b4594;height:5px;border-radius:4px 4px 0 0;margin:-32px -32px 24px;"></div>
  <h2 style="color:#0f172a;margin:0 0 8px;">Your visitor has arrived</h2>
  <p style="color:#475569;font-size:15px;margin:0 0 20px;">Hi <strong>${hostName || 'there'}</strong>,</p>
  <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:20px;margin-bottom:20px;">
    <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>👤 Visitor:</strong> ${visitorName}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>📍 Site:</strong> ${siteName || 'Your site'}</p>
    <p style="margin:0;font-size:14px;color:#166534;"><strong>🕐 Arrived at:</strong> ${timeLabel}</p>
  </div>
  <p style="color:#6b7280;font-size:13px;margin:0;">Please proceed to reception to greet your visitor.</p>
</div>`,
  });
};

module.exports = {
  sendMail,
  generateResetToken,
  sendPasswordResetEmail,
  sendContactEmail,
  sendMobileInviteEmail,
  sendPreRegistrationInviteEmail,
  sendWelcomeEmail,
  sendAdminCredentialsEmail,
  sendVisitorArrivalNotificationEmail,
};
