const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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

        req.login(user, (err) => {
            if (err) return next(err);
            res.json({ msg: 'Login successful' });
        });
    })(req, res, next);
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to dashboard.
        res.redirect(frontendUrl);
    });

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to dashboard.
        res.redirect(frontendUrl);
    });

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).send('Failed to logout');
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).send('Logged out');
        });
    });
});

router.get('/login-history', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({
        username: req.user.name,
        loginHistory: req.user.loginHistory
    });
});

router.get('/isAuthenticated', (req, res) => {
    console.log('Session:', req.session);
    console.log('User:', req.user);
    res.json({ isAuthenticated: req.isAuthenticated() });
});

module.exports = router;
