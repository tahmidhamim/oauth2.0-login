const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    phoneNumber: { type: String, default: '' },
    is2FAEnabled: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    loginHistory: [
        {
            method: { type: String },
            date: { type: Date }
        }
    ]
});

module.exports = mongoose.model('User', UserSchema);
