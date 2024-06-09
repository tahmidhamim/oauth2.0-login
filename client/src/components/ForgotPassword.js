import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
            toast.success(response.data.message);
        } catch (err) {
            console.error('Failed to send reset password email', err);
            toast.error(err.response.data.msg || 'Failed to send reset password email');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Forgot Password?</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <button type="submit">Send Reset Link</button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ForgotPassword;
