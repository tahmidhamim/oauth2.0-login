import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${backendUrl}/auth/isAuthenticated`, {
                    withCredentials: true
                });
                setIsAuthenticated(response.data.isAuthenticated);
                if (!response.data.isAuthenticated) {
                    navigate('/login');
                }
            } catch (err) {
                console.error('Failed to check authentication', err);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    if (isAuthenticated === null) return <div>Loading...</div>;

    return isAuthenticated ? children : null;
};

export default ProtectedRoute;
