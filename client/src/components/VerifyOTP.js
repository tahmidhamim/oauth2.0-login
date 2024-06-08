// VerifyOTP.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const navigate = useNavigate();

    useEffect(() => {
        let token = localStorage.getItem('token');

        const checkAuth = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                let response = await axios.get(`${backendUrl}/auth/isAuthenticated`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.data.isAuthenticated) {
                    navigate('/login');
                    return;
                }
                response = await axios.get(`${backendUrl}/auth/isVerified`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.data.isVerified) {
                    navigate('/verify-email');
                    return;
                }
                response = await axios.get(`${backendUrl}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.data.is2FAEnabled || !response.data.otpExpires) {
                    navigate('/');
                }
            } catch (err) {
                console.error('Failed to check authentication', err);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        checkAuth();

        const savedTimestamp = localStorage.getItem('resendOTPTimestamp');
        if (savedTimestamp) {
            const timePassed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
            if (timePassed < 600) {
                setIsButtonDisabled(true);
                setTimer(600 - timePassed);
            } else {
                localStorage.removeItem('resendOTPTimestamp');
            }
        }
    }, [navigate]);

    useEffect(() => {
        let interval = null;
        if (isButtonDisabled) {
            interval = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        clearInterval(interval);
                        setIsButtonDisabled(false);
                        return 600; // Reset timer to 10 minutes
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isButtonDisabled]);

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${backendUrl}/auth/verify-otp`, { otp }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.msg);
            navigate('/');
        } catch (err) {
            console.error('Failed to verify OTP', err);
            toast.error(err.response.data.msg || 'Invalid or expired OTP');
        }
    };

    const handleClick = async () => {
        let token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/auth/send-otp`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.message);
            setIsButtonDisabled(true);
            setTimer(600);
            localStorage.setItem('resendOTPTimestamp', Date.now().toString());
        } catch (error) {
            toast.error(error.response.data.message || 'Error resending OTP');
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const logout = async () => {
        localStorage.removeItem('token');
        try {
            await axios.get(`${backendUrl}/auth/logout`);
            navigate('/login');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    return (
        <div className="auth-container">
            <button className="logout-button" onClick={logout}>Logout</button>
            <div className="auth-box">
                <h2>Verify OTP</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="otp">OTP:</label>
                        <input type="text" id="otp" value={otp} onChange={e => setOtp(e.target.value)} required />
                    </div>
                    <button type="submit">Verify</button>
                </form>
                <button className='button-basic' onClick={handleClick} disabled={isButtonDisabled}>
                    {isButtonDisabled ? `Resend OTP (${formatTime(timer)})` : 'Resend OTP'}
                </button>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VerifyOTP;
