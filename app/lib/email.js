const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOtpEmail(toEmail, otp, purpose) {
  const config = {
    reset: {
      subject: 'Your Password Reset Code',
      heading: 'Your verification code',
      description: 'Use this code to reset your password. It expires in 10 minutes.',
    },
    verify: {
      subject: 'Verify Your Email',
      heading: 'Confirm your email address',
      description: 'Use this code to verify your account. It expires in 10 minutes.',
    },
    login: {
      subject: 'Your Login Verification Code',
      heading: 'Your login code',
      description: 'Use this code to complete your login. It expires in 10 minutes.',
    },
  };

  const selected = config[purpose] || config.reset;

  await transporter.sendMail({
    from: '"AuthApp" <' + process.env.GMAIL_USER + '>',
    to: toEmail,
    subject: selected.subject,
    html:
      '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">' +
      '<p style="color: #B8935F; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">AuthApp</p>' +
      '<h2 style="color: #14140F;">' + selected.heading + '</h2>' +
      '<p style="color: #6B6858; font-size: 14px;">' + selected.description + '</p>' +
      '<div style="background: #F7F5EF; border: 1px solid #DDD8CC; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">' +
      '<span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #122A22;">' + otp + '</span>' +
      '</div>' +
      '<p style="color: #6B6858; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>' +
      '</div>',
  });
}

module.exports = { sendOtpEmail };