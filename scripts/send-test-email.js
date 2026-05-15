require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection OK');

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: 'Test email from Digital Essentials',
      text: 'This is a test email to verify the SMTP configuration. If you received this, SMTP is working.',
    });

    console.log('Test email sent:', info.messageId || info.response);
  } catch (err) {
    console.error('SMTP ERROR:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
