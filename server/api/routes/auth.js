const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');
const redis = require('redis');
const twilio = require('twilio');
const { sendVerificationEmail, sendResetEmail } = require('../email/sendEmail');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Twilio Auth Token
const client = twilio(accountSid, authToken);

// Create Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis error: ', err);
});

(async () => {
    await redisClient.connect();
})();

const createToken = (user, expires) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: expires
    });
};

const generateTempCode = async (userId, email) => {
    const code = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 300000; // 5 minutes expiration
    const tempData = JSON.stringify({ userId, email, expires });

    await redisClient.setEx(code, 300, tempData); // Store in Redis with 5 minutes expiration

    return code;
};

// Register route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user && user.password) {
            return res.status(400).json({ msg: 'User already exists' });
        } else if (!user) {
            user = new User({
                name,
                email,
                password,
                verificationToken: null
            });
            const verificationToken = createToken(user, '1h');
            user.verificationToken = verificationToken;
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        if (!user.isVerified) {
            sendVerificationEmail(email, name, user.verificationToken);
        }
        res.send('User registered');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = createToken(user, '1d');
        res.json({ token, is2FAEnabled: user.is2FAEnabled, otpExpires: user.otpExpires, msg: 'Login successful' });
    })(req, res, next);
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        const tempCode = await generateTempCode(req.user.id, req.user.email);
        res.redirect(`${frontendUrl}/oauth-success?code=${tempCode}`);
    });

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        const tempCode = await generateTempCode(req.user.id, req.user.email);
        res.redirect(`${frontendUrl}/oauth-success?code=${tempCode}`);
    });

// Logout route
router.get('/logout', (req, res) => {
    res.status(200).send('Logged out');
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.name,
            isVerified: user.isVerified,
            phoneNumber: user.phoneNumber,
            is2FAEnabled: user.is2FAEnabled,
            otpExpires: user.otpExpires,
            loginHistory: user.loginHistory
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/isAuthenticated', verifyToken, (req, res) => {
    res.json({ isAuthenticated: true });
});

// Endpoint to exchange code for token
router.post('/exchange-code', async (req, res) => {
    const { code } = req.body;

    const tempData = await redisClient.get(code);
    if (!tempData) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const parsedData = JSON.parse(tempData);

    if (parsedData.expires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const user = await User.findById(parsedData.userId);
    const token = createToken(user, '1d');

    await redisClient.del(code); // Remove the code once used

    res.json({ token, is2FAEnabled: user.is2FAEnabled, otpExpires: user.otpExpires });
});

router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
  
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email, verificationToken: token });
    
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
    
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        const tempCode = await generateTempCode(user.id, user.email);
        res.redirect(`${frontendUrl}/oauth-success?code=${tempCode}`);
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: 'Invalid token' });
    }
});

router.get('/resend-verification-email', verifyToken, async (req, res) => {
    const { email } = req.user;
  
    try {
        const user = await User.findOne({ email });
    
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
    
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }
    
        const verificationToken = createToken(user, '1h');
        user.verificationToken = verificationToken;
        await user.save();
    
        sendVerificationEmail(email, user.name, verificationToken);
        res.status(200).json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error resending verification email', error });
    }
});

router.get('/isVerified', verifyToken, async (req, res) => {
    const { id } = req.user;
  
    try {
        const user = await User.findById(id);
    
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        res.json({ isVerified: user.isVerified });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error resending verification email', error });
    }
});

// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const token = createToken(user, '1h');

        sendResetEmail(user.email, user.name, token);

        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Reset Password - Update Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update User Profile
router.post('/update-profile', verifyToken, async (req, res) => {
    const { name, phoneNumber, password, is2FAEnabled } = req.body;
    try {
        if (is2FAEnabled && !phoneNumber) {
            return res.status(400).json({ msg: 'Bad request' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.name = name || user.name;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        user.is2FAEnabled = is2FAEnabled;

        await user.save();
        res.status(200).json({ msg: 'Profile updated' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Send OTP
router.get('/send-otp', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!user.is2FAEnabled) {
            return res.status(400).json({ msg: 'Bad request' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        await client.messages.create({
            body: `Your OTP is ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phoneNumber
        });

        res.status(200).json({ msg: 'OTP sent' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Verify OTP
router.post('/verify-otp', verifyToken, async (req, res) => {
    const { otp } = req.body;
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!user.is2FAEnabled) {
            return res.status(400).json({ msg: 'Bad request' });
        }

        if (user.otp === otp && user.otpExpires > Date.now()) {
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            res.status(200).json({ msg: 'OTP verified' });
        } else {
            res.status(400).json({ msg: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
