const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Connect to database
connectDB();

console.log('index.js-FRONTEND_URL: ', process.env.FRONTEND_URL);
console.log('index.js-SESSION_SECRET: ', process.env.SESSION_SECRET);
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport config
require('./config/passport')(passport);

// Routes
app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
