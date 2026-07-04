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

module.exports = {
    generateResetToken,
    sendPasswordResetEmail,
    sendContactEmail,
    sendMobileInviteEmail,
    sendPreRegistrationInviteEmail
};

