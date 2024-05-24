const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    loginHistory: [
        {
            method: { type: String },
            date: { type: Date }
        }
    ]
});

module.exports = mongoose.model('User', UserSchema);
