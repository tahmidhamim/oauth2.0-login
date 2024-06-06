const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = (toEmail, name, token) => {
    const verificationLink = `${backendUrl}/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Verify Your Email',
        html: `
            <h1>Welcome to OAuth 2.0 Login!</h1>
            <p>Dear ${name},</p>
            <p>Thank you for registering with OAuth 2.0 Login. We're excited to have you on board.</p>
            <p>Click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 1 hour.</p>
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

const sendResetEmail = (toEmail, name, token) => {
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Password Reset',
        html: `
            <h1>Reset your password!</h1>
            <p>Dear ${name},</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
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

module.exports = { sendVerificationEmail, sendResetEmail };
