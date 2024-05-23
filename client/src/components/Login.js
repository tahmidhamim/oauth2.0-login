import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${backendUrl}/auth/isAuthenticated`, {
                    withCredentials: true
                });
                if (response.data.isAuthenticated) {
                    navigate('/');
                }
            } catch (err) {
                console.error('Failed to check authentication', err);
            }
        };

        checkAuth();
    }, [navigate]);

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post(`${backendUrl}/auth/login`, { email, password }, { withCredentials: true });
            navigate('/');
        } catch (err) {
            console.error('Failed to login', err);
            toast.error(err.response.data.msg || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Login</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
                <div className="social-login">
                    <button className="social-button google" onClick={() => window.location.href = `${backendUrl}/auth/google`}>
                        Login with Google
                    </button>
                    <button className="social-button facebook" onClick={() => window.location.href = `${backendUrl}/auth/facebook`}>
                        Login with Facebook
                    </button>
                </div>
                <ToastContainer />
            </div>
        </div>
    );
};

export default Login;
