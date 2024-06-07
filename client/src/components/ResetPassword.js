import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/auth/reset-password/${token}`, { password });
            toast.success(response.data.message);
            navigate('/login');
        } catch (err) {
            console.error('Failed to reset password', err);
            toast.error(err.response.data.msg || 'Failed to reset password');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Reset Password</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password:</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit">Reset Password</button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ResetPassword;
