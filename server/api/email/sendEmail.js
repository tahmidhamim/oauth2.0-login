const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = (toEmail, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Welcome to OAuth 2.0 Login!',
    html: `
      <h1>Welcome to OAuth 2.0 Login!</h1>
      <p>Dear ${name},</p>
      <p>Thank you for registering with OAuth 2.0 Login. We're excited to have you on board.</p>
      <p>Best regards,<br>Tahmid Hamim</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendWelcomeEmail };
