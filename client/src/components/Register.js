import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`${backendUrl}/auth/isAuthenticated`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data.isAuthenticated) {
                        navigate('/');
                    }
                } catch (err) {
                    console.error('Failed to check authentication', err);
                }
            }
        };

        checkAuth();
    }, [navigate]);

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/auth/register`, { name, email, password });
            const token = response.data.token;
            localStorage.setItem('token', token);
            toast.success('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000); // Redirect after 2 seconds to show the success message
        } catch (err) {
            console.error('Failed to register', err);
            toast.error(err.response.data.msg || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Register</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit">Register</button>
                </form>
                <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Register;
