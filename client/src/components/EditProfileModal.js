// EditProfileModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Modal.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const EditProfileModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${backendUrl}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const { username, phoneNumber, is2FAEnabled } = response.data;
                setName(username);
                setPhoneNumber(phoneNumber || '');
                setIs2FAEnabled(is2FAEnabled);
            } catch (error) {
                console.error('Failed to fetch profile data', error);
            }
        };

        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${backendUrl}/auth/update-profile`, {
                name, phoneNumber, password, is2FAEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Profile updated successfully');
            onClose();
        } catch (error) {
            console.error('Failed to update profile', error);
            toast.error('Failed to update profile');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <h2>Edit Profile</h2>
                <div className="form-group">
                    <label>Name:</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Phone Number (optional for 2FA):</label>
                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>
                        <input type="checkbox" checked={is2FAEnabled} onChange={e => setIs2FAEnabled(e.target.checked)} />
                        Enable Two-Factor Authentication
                    </label>
                </div>
                <button onClick={handleSave}>Save</button>
                <button className='cancel' onClick={onClose}>Cancel</button>
            </div>
            <ToastContainer />
        </div>
    );
};

export default EditProfileModal;
