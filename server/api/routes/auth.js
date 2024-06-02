const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const createToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

// In-memory store for temporary codes
const tempCodeStore = {};

const generateTempCode = (userId, email) => {
    const code = crypto.randomBytes(20).toString('hex');
    tempCodeStore[code] = { userId, email, expires: Date.now() + 300000 }; // 5 minutes expiration
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
    (req, res) => {
        const tempCode = generateTempCode(req.user.id, req.user.email);
        res.redirect(`${frontendUrl}/oauth-success?code=${tempCode}`);
    });

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const tempCode = generateTempCode(req.user.id, req.user.email);
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
router.post('/exchange-code', (req, res) => {
    const { code } = req.body;
    const tempData = tempCodeStore[code];

    if (!tempData || tempData.expires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const user = { id: tempData.userId, email: tempData.email }; // Fetch user data if necessary
    const token = createToken(user);

    delete tempCodeStore[code]; // Remove the code once used

    res.json({ token });
});

module.exports = router;
