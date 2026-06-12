import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await API.get('/dashboard/admin');
                setData(res.data);
            } catch (err) {
                console.error("Error fetching dashboard block", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Optional: Refresh periodically (e.g. every 30 seconds) for real-time vibe
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading real-time dashboard...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>HQ Operations Dashboard</h2>
                <div>
                    <span style={{ marginRight: '20px', fontWeight: 'bold' }}>Welcome, {user?.name} ({user?.role})</span>
                    <button onClick={logout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                </div>
            </div>
            
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{data?.stats?.activeProjects || 0}</h1>
                    <p style={{ margin: 0, color: '#6c757d' }}>Active Projects</p>
                </div>
                <div style={{ padding: '20px', background: '#e2f0d9', borderRadius: '8px', textAlign: 'center' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#28a745' }}>{data?.stats?.employeesWorking || 0}</h1>
                    <p style={{ margin: 0, color: '#6c757d' }}>Employees Currently Working</p>
                </div>
                <div style={{ padding: '20px', background: '#cce5ff', borderRadius: '8px', textAlign: 'center' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{data?.stats?.totalHoursToday || 0} hrs</h1>
                    <p style={{ margin: 0, color: '#6c757d' }}>Total Hours Logged Today</p>
                </div>
                <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{data?.stats?.completedTasksToday || 0}</h1>
                    <p style={{ margin: 0, color: '#6c757d' }}>Tasks Completed Today</p>
                </div>
            </div>

            {/* Live Employee Status Table */}
            <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', background: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>Live Employee Status</h3>
                {data?.liveActivity && data.liveActivity.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px' }}>Employee</th>
                                <th style={{ padding: '12px' }}>Project</th>
                                <th style={{ padding: '12px' }}>Active Task</th>
                                <th style={{ padding: '12px' }}>Started At</th>
                                <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.liveActivity.map((activity, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '12px' }}><b>{activity.employee_name}</b></td>
                                    <td style={{ padding: '12px' }}>{activity.project_name}</td>
                                    <td style={{ padding: '12px' }}>{activity.task_name}</td>
                                    <td style={{ padding: '12px' }}>{new Date(activity.start_time).toLocaleTimeString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#28a745', borderRadius: '50%', marginRight: '8px' }}></span>
                                        Working
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No employees are currently running active timers.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
