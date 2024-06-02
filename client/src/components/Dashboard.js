import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { Table, Pagination, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Dashboard = () => {
    const [username, setUsername] = useState(null);
    const [loginHistory, setLoginHistory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch login history
        const fetchLoginHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get(`${backendUrl}/auth/login-history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data;
                setUsername(data.username);
                setLoginHistory(data.loginHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (err) {
                console.error('Failed to fetch login history', err);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        fetchLoginHistory();
    }, [navigate]);

    if (!username || !loginHistory) return <div>Loading...</div>;

    const logout = async () => {
        localStorage.removeItem('token');
        try {
            await axios.post(`${backendUrl}/auth/logout`);
            navigate('/login');
        } catch (err) {
            console.error('Failed to logout', err);
        }
    };

    const getLoginCounts = () => {
        const counts = { Custom: 0, Google: 0, Facebook: 0 };
        loginHistory.forEach(record => {
            counts[record.method] = (counts[record.method] || 0) + 1;
        });
        return counts;
    };

    const loginCounts = getLoginCounts();

    const data = {
        labels: ['Custom', 'Google', 'Facebook'],
        datasets: [
            {
                label: 'Login Count',
                data: [loginCounts.Custom, loginCounts.Google, loginCounts.Facebook],
                backgroundColor: ['rgba(75, 192, 192, 0.9)', 'rgba(255, 99, 132, 0.9)', 'rgba(54, 162, 235, 0.9)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }
        ]
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = loginHistory.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(loginHistory.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    return (
        <div className="dashboard-container">
            <button className="logout-button" onClick={logout}>Logout</button>
            <div className="dashboard-content">
                <h2 className="welcome-message">Welcome, {username}</h2>
                <div className="chart">
                    <h4>Pie Chart</h4>
                    <Pie data={data} />
                </div>
                <div className="chart">
                    <h4>Bar Chart</h4>
                    <Bar data={data} />
                </div>
            </div>
            <div className="table-container">
                <h4>Login History</h4>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr key={index}>
                                <td>{record.method}</td>
                                <td>{new Date(record.date).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <div className="d-flex justify-content-between">
                    <Dropdown onSelect={handleItemsPerPageChange}>
                        <Dropdown.Toggle variant="primary" id="dropdown-basic">
                            {itemsPerPage}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="5">5</Dropdown.Item>
                            <Dropdown.Item eventKey="10">10</Dropdown.Item>
                            <Dropdown.Item eventKey="20">20</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Pagination>
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {currentPage > 4 &&
                            <Pagination.Item key={1} active={false} onClick={() => {}}>
                                {'...'}
                            </Pagination.Item>
                        }
                        {Array.from({ length: totalPages }, (_, i) => (
                            Math.abs(i + 1 - currentPage) < 4 &&
                            <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
                                {i + 1}
                            </Pagination.Item>
                        ))}
                        {totalPages - currentPage > 3 &&
                            <Pagination.Item key={totalPages + 1} active={false} onClick={() => {}}>
                                {'...'}
                            </Pagination.Item>
                        }
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
