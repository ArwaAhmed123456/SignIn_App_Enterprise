const nodemailer = require('nodemailer');

// ===============================
// Email configuration (Render-safe)
// ===============================
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,              // MUST be 587 on Render
    secure: false,          // MUST be false
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Optional: verify SMTP connection (safe to keep)
transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP connection failed:", error);
    } else {
        console.log("SMTP server is ready to send emails");
    }
});

// ===============================
// Generate 6-digit verification code
// ===============================
const generateResetToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===============================
// Send password reset email
// ===============================
const sendPasswordResetEmail = async (email, projectName, resetToken) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Attendance Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Password Reset - ${projectName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        h1 {
            color: #0891b2;
            margin: 0;
            font-size: 24px;
        }
        .token-box {
            background: #f0f9ff;
            border: 2px solid #0891b2;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .token {
            font-size: 36px;
            font-weight: bold;
            color: #0891b2;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .info {
            background: #fff7ed;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AP</div>
            <h1>Password Reset Request</h1>
        </div>

        <p>Hello,</p>
        <p>You requested to reset the password for project <strong>${projectName}</strong>.</p>

        <div class="token-box">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                Your verification code is:
            </p>
            <div class="token">${resetToken}</div>
        </div>

        <div class="info">
            <strong>⏰ Important:</strong> This code will expire in 15 minutes for security reasons.
        </div>

        <p>If you didn't request this password reset, please ignore this email.</p>

        <div class="footer">
            <p>This is an automated message from Attendance Pro</p>
            <p>© ${new Date().getFullYear()} Attendance Pro. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// ===============================
// Send contact form email (User → Admin)
// ===============================
const sendContactEmail = async (userEmail, query) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Attendance Pro" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: userEmail,
        subject: `New Query from Attendance App User`,
        html: `
<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #0891b2;">New User Query</h2>
    <p><strong>From:</strong> ${userEmail}</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0891b2; margin: 20px 0;">
        <p style="white-space: pre-wrap;">${query}</p>
    </div>
    <p style="font-size: 0.9em; color: #666;">
        You can reply directly to this email to respond to the user.
    </p>
</div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Contact email sending error:', error);
        return { success: false, error: error.message };
    }
};

// ===============================
// Send pre-registration invitation
// ===============================
const sendPreRegistrationInviteEmail = async ({ email, name, siteName, expectedDate, notes }) => {
    const visitLabel = expectedDate
        ? new Date(expectedDate).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'a scheduled visit';

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Sign In App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your visit to ${siteName || 'our site'}`,
        html: `
<div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 640px;">
    <h2 style="margin: 0 0 16px; color: #1f2937;">Visit invitation</h2>
    <p style="margin: 0 0 12px; color: #475569;">Hello ${name || 'visitor'},</p>
    <p style="margin: 0 0 12px; color: #475569;">
        You have been pre-registered for a visit at <strong>${siteName || 'our site'}</strong>.
    </p>
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Expected arrival:</strong> ${visitLabel}</p>
        ${notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
    <p style="margin: 0; color: #64748b;">
        If you need to make any changes, please reply to this email.
    </p>
</div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Pre-registration invite sending error:', error);
        return { success: false, error: error.message };
    }
};

// ===============================
// Send mobile companion activation token (Module 2)
// ===============================
const sendMobileInviteEmail = async (guard, plainToken) => {
    // Format as XXXX-XXXX-XXXX for readability
    const formatted = `${plainToken.slice(0,4)}-${plainToken.slice(4,8)}-${plainToken.slice(8,12)}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Attendance Pro" <${process.env.EMAIL_USER}>`,
        to: guard.email,
        subject: `Your Mobile App Activation Code — Tripod Services`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo-box { background: #2b4594; color: white; width: 60px; height: 60px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; margin-bottom: 16px; }
        h1 { color: #0f172a; margin: 0; font-size: 22px; }
        .token-box { background: #f0f4ff; border: 2px solid #2b4594; border-radius: 12px; padding: 28px; text-align: center; margin: 28px 0; }
        .token { font-size: 38px; font-weight: 900; color: #2b4594; letter-spacing: 6px; font-family: 'Courier New', monospace; }
        .token-label { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .warning { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
        .steps { background: #f8fafc; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
        .steps ol { margin: 8px 0; padding-left: 20px; }
        .steps li { margin-bottom: 6px; font-size: 14px; color: #475569; }
        .footer { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-box">TS</div>
            <h1>Mobile App Activation</h1>
            <p style="color:#64748b; margin-top:8px;">Hi ${guard.name}, you've been granted mobile access to the Attendance Pro companion app.</p>
        </div>

        <div class="token-box">
            <div class="token-label">Your 12-Digit Activation Code</div>
            <div class="token">${formatted}</div>
        </div>

        <div class="warning">
            <strong>⏰ This code expires in 72 hours</strong> and can only be used once. Do not share it with anyone.
        </div>

        <div class="steps">
            <strong style="color:#0f172a;">How to activate:</strong>
            <ol>
                <li>Open the <strong>Attendance Pro</strong> mobile app on your phone</li>
                <li>Tap <strong>"Activate with Code"</strong> on the welcome screen</li>
                <li>Enter the 12-digit code above</li>
                <li>Your device will be paired and you're ready to go</li>
            </ol>
        </div>

        <p style="font-size:13px; color:#64748b;">If you did not request this, please contact your site manager immediately.</p>

        <div class="footer">
            <p>Tripod Services — Attendance Pro</p>
            <p>© ${new Date().getFullYear()} Tripod Services UK. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Mobile invite email error:', error);
        return { success: false, error: error.message };
    }
};

// ===============================
// Send welcome email to new member (matches Sign In App reference)
// ===============================
const sendWelcomeEmail = async ({ email, name, groupName, siteName, orgName, companionCode }) => {
  const BASE_URL = process.env.VITE_APP_URL || 'https://tripod-signin-app.onrender.com';
  const memberId = email; // use email as fallback QR identifier
  const qrValue  = `MEMBER:${email}`;

  // Format companion code as XXXX-XXXX-XXXX if provided
  const formattedCode = companionCode
    ? `${companionCode.slice(0,4)}-${companionCode.slice(4,8)}-${companionCode.slice(8,12)}`
    : null;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Sign In App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome${groupName ? ` to ${groupName}` : ''} — ${orgName || siteName || 'Sign In App'}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#f3f4f6; }
  .wrap { max-width:620px; margin:32px auto; padding:0 16px 40px; }
  .card { background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .top-bar { background:#2b4594; height:6px; }
  .body { padding:40px 40px 32px; }
  h1 { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 8px; }
  p { color:#475569; font-size:15px; line-height:1.6; margin:0 0 16px; }
  .highlight-box { background:#f0f4ff; border:1px solid #c7d7fe; border-radius:12px; padding:20px 24px; margin:24px 0; }
  .highlight-box h2 { font-size:15px; font-weight:700; color:#2b4594; margin:0 0 8px; }
  .qr-section { text-align:center; margin:28px 0; padding:24px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; }
  .qr-section p { font-size:14px; color:#64748b; margin:0 0 16px; }
  .code-box { background:#0f172a; border-radius:12px; padding:24px; text-align:center; margin:24px 0; }
  .code-box .label { color:#94a3b8; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; }
  .code-box .code { color:#4ade80; font-size:34px; font-weight:900; letter-spacing:6px; font-family:'Courier New',monospace; }
  .code-box .expire { color:#64748b; font-size:12px; margin-top:10px; }
  .steps { margin:20px 0; }
  .step { display:flex; align-items:flex-start; gap:14px; margin-bottom:16px; }
  .step-num { background:#2b4594; color:#fff; width:28px; height:28px; border-radius:50%; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .step-body { flex:1; font-size:14px; color:#374151; line-height:1.5; }
  .step-body strong { color:#0f172a; }
  .new-code-btn { display:inline-block; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; color:#374151; text-decoration:none; margin:4px 0 20px; }
  .divider { border:none; border-top:1px solid #e5e7eb; margin:28px 0; }
  .footer { text-align:center; padding:0 40px 32px; }
  .footer p { font-size:13px; color:#94a3b8; margin:4px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="top-bar"></div>
    <div class="body">

      <h1>Welcome${name ? `, ${name}` : ''}!</h1>
      <p>
        Dear ${name || 'Member'}, you have been registered as a member of the
        <strong>${groupName || 'Employees'}</strong> group at
        <strong>${orgName || siteName || 'our organisation'}</strong>.
      </p>

      <!-- QR Code section -->
      <div class="qr-section">
        <h2 style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 8px;">Scan your QR code on arrival</h2>
        <p>The provided QR Code will be required to scan at the iPad when you arrive. This will allow our system to quickly recover your details and request any further information we need from you.</p>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}&color=0f172a&bgcolor=ffffff&qzone=2"
          alt="Your QR Code"
          width="180"
          style="border-radius:12px;border:1px solid #e2e8f0;"
        />
      </div>

      ${formattedCode ? `
      <!-- Companion app section -->
      <hr class="divider" />
      <div class="highlight-box">
        <h2>🔗 Companion app</h2>
        <p style="font-size:14px;margin:0;">Your account has been granted permission to use the Sign In App companion app. With our companion app, you can easily sign in and out of the premises on arrival.</p>
      </div>

      <p style="font-weight:700;color:#0f172a;margin:0 0 4px;">Getting started</p>
      <p style="font-size:14px;margin:0 0 20px;">All you need to get started is an Apple iPhone, Android phone or access to a web browser.</p>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-body"><strong>Download the mobile app</strong><br/>Search for <em>Sign In Companion</em> in the App Store or Play Store, or open the app on your phone.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body"><strong>Enter your code.</strong><br/>Enter your 12-character code below and tap <strong>Connect</strong>.<br/>If your code has expired, use the button below to request a new one.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body"><strong>That's it, all done!</strong><br/>You're now ready to start using the companion app to sign in.</div>
        </div>
      </div>

      <a href="mailto:${process.env.EMAIL_USER}?subject=New%20companion%20code%20request" class="new-code-btn">Send me a new code</a>

      <p style="font-weight:700;color:#0f172a;margin:0 0 8px;">Your companion app code (valid for 72 hours):</p>
      <div class="code-box">
        <div class="label">Activation Code</div>
        <div class="code">${formattedCode}</div>
        <div class="expire">⏰ Expires in 72 hours — use only once</div>
      </div>
      ` : ''}

      <hr class="divider" />

      <div class="highlight-box" style="background:#f0fdf4;border-color:#bbf7d0;">
        <h2 style="color:#15803d;">✅ You are now set for your visit to us</h2>
        <p style="font-size:14px;color:#166534;margin:0;">
          Please don't delete this email. When you arrive, scan the QR code and bring any other documents we may have requested. We look forward to seeing you soon!
        </p>
      </div>

    </div>
    <div class="footer">
      <p>Powered by <strong>Sign In App</strong> — ${orgName || siteName || 'Tripod Services'}</p>
      <p>© ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
    generateResetToken,
    sendPasswordResetEmail,
    sendContactEmail,
    sendMobileInviteEmail,
    sendPreRegistrationInviteEmail,
    sendWelcomeEmail,
};

