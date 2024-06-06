import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './VerifyEmail.css'; // Create and use this CSS file for better styling

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [timer, setTimer] = useState(300); // 5 minutes in seconds

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
                if (response.data.isVerified) {
                    navigate('/');
                }
            } catch (err) {
                console.error('Failed to check authentication', err);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        checkAuth();

        const savedTimestamp = localStorage.getItem('resendTimestamp');
        if (savedTimestamp) {
            const timePassed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
            if (timePassed < 300) {
                setIsButtonDisabled(true);
                setTimer(300 - timePassed);
            } else {
                localStorage.removeItem('resendTimestamp');
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
                        return 300; // Reset timer to 5 minutes
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isButtonDisabled]);

    const handleClick = async () => {
        let token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get(`${backendUrl}/auth/resend-verification-email`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.message);
            setIsButtonDisabled(true);
            setTimer(300);
            localStorage.setItem('resendTimestamp', Date.now().toString());
        } catch (error) {
            toast.error(error.response.data.message || 'Error resending verification email');
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
            await axios.post(`${backendUrl}/auth/logout`);
            navigate('/login');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    return (
        <div className="verify-email-container">
            <button className="logout-button" onClick={logout}>Logout</button>
            <h1>Verify Email</h1>
            <p>Check your email for the verification link.</p>
            <button className='button-basic' onClick={handleClick} disabled={isButtonDisabled}>
                {isButtonDisabled ? `Resend Email (${formatTime(timer)})` : 'Resend Email'}
            </button>
            <ToastContainer />
        </div>
    );
};

export default VerifyEmail;
