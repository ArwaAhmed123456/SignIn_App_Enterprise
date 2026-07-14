require('dotenv').config();
const { sendMail } = require('./services/emailService');

const recipient = 'arwaahmed1501@gmail.com'; // Try sending to verified/other address to verify SMTP bypasses verified-only Resend lock.

console.log('Starting direct SMTP verification test...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('SMTP_HOST:', process.env.SMTP_HOST);

sendMail({
  to: recipient,
  subject: 'Test Email via SMTP from Sign In App',
  html: '<div style="font-family:sans-serif;padding:20px;"><h2>SMTP Test Successful!</h2><p>This email was sent using the configured SMTP server for Abid.fiaz@tripodsvcs.co.uk.</p></div>'
}).then(res => {
  if (res.success) {
    console.log('✅ TEST PASSED:', res);
  } else {
    console.error('❌ TEST FAILED:', res.error);
  }
  process.exit(res.success ? 0 : 1);
}).catch(err => {
  console.error('❌ EXCEPTION during test:', err);
  process.exit(1);
});
