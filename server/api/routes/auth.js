const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');
const redis = require('redis');
const { sendWelcomeEmail } = require('../email/sendEmail');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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

const createToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1d'
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
                password
            });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        sendWelcomeEmail(email, name);
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

        const token = createToken(user);
        res.json({ token, msg: 'Login successful' });
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
router.post('/logout', (req, res) => {
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
        res.status(401).json({ message: 'Unauthorized' });
    }
};

router.get('/login-history', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.name,
            loginHistory: user.loginHistory
        });
    } catch (err) {
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

    const user = { id: parsedData.userId, email: parsedData.email }; // Fetch user data if necessary
    const token = createToken(user);

    await redisClient.del(code); // Remove the code once used

    res.json({ token });
});

module.exports = router;
