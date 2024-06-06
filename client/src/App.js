import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import OAuthSuccess from './components/OAuthSuccess';
import VerifyEmail from './components/VerifyEmail';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/oauth-success" element={<OAuthSuccess />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
            </Routes>
        </Router>
    );
};

export default App;
