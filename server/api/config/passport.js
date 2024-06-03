const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { sendWelcomeEmail } = require('../email/sendEmail');

dotenv.config();

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

module.exports = function(passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            let user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            user.loginHistory.push({ method: 'Custom', date: new Date() });
            await user.save();

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${backendUrl}/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        const newUser = {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            loginHistory: [{ method: 'Google', date: new Date() }]
        };
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                user.googleId = profile.id;
                user.loginHistory.push({ method: 'Google', date: new Date() });
                await user.save();
                done(null, user);
            } else {
                user = await User.create(newUser);
                sendWelcomeEmail(newUser.email, newUser.name);
                done(null, user);
            }
        } catch (err) {
            console.error(err);
        }
    }));

    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${backendUrl}/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails']
    }, async (accessToken, refreshToken, profile, done) => {
        const newUser = {
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            loginHistory: [{ method: 'Facebook', date: new Date() }]
        };
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                user.facebookId = profile.id;
                user.loginHistory.push({ method: 'Facebook', date: new Date() });
                await user.save();
                done(null, user);
            } else {
                user = await User.create(newUser);
                sendWelcomeEmail(newUser.email, newUser.name);
                done(null, user);
            }
        } catch (err) {
            console.error(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
