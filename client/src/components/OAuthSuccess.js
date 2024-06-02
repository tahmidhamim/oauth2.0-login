import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');

    useEffect(() => {
        const exchangeCodeForToken = async () => {
            try {
                const response = await axios.post(`${backendUrl}/auth/exchange-code`, { code });
                const { token } = response.data;
                localStorage.setItem('token', token); // Securely store the token
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } catch (err) {
                console.error(err);
                toast.error('Login failed');
                navigate('/login');
            }
        };

        if (code) {
            exchangeCodeForToken();
        } else {
            navigate('/login');
        }
    }, [code, navigate]);

    return (
        <div>
            <ToastContainer />
            <p>Logging in...</p>
        </div>
    );
};

export default OAuthSuccess;
