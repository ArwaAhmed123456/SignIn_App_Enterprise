const { Resend } = require('resend');
const resend = new Resend('re_VNS3nxhP_HQZSqZnb45boqastuZFRi8em');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'arwaahmed1501@gmail.com',
  subject: 'Test Email from Direct API Call',
  html: '<p>This is a test to verify your Resend API key works.</p>'
}).then(result => {
  console.log('SUCCESS:', JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(error => {
  console.log('ERROR:', JSON.stringify(error, null, 2));
  process.exit(1);
});
