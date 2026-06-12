import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';

const EmployeeDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [tasks, setTasks] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);

    useEffect(() => {
        // Load projects assigned to employee
        const loadProjects = async () => {
            try {
                const res = await API.get('/projects');
                setProjects(res.data);
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };
        loadProjects();
    }, []);

    useEffect(() => {
        // Load tasks when a project is selected
        if (selectedProject) {
            const loadTasks = async () => {
                try {
                    const res = await API.get(`/projects/${selectedProject}/tasks`);
                    setTasks(res.data.filter(t => t.status !== 'Completed'));
                } catch (err) {
                    console.error("Failed to load tasks", err);
                }
            };
            loadTasks();
        } else {
            setTasks([]);
        }
    }, [selectedProject]);

    const handleStartWork = async (taskId, taskName) => {
        try {
            const res = await API.post('/time/start', { projectId: selectedProject, taskId });
            setActiveTimer({ taskId, taskName, startTime: res.data.start_time });
            alert(`Started working on: ${taskName}`);
        } catch (err) {
            alert("Failed to start timer.");
        }
    };

    const handleStopWork = async () => {
        try {
            const res = await API.post('/time/stop');
            setActiveTimer(null);
            alert(`Stopped working. Logged ${res.data.durationMinutes} minutes.`);
        } catch (err) {
            alert("Failed to stop timer.");
        }
    };
    
    // Custom wrapper for AuthContext logout that automatically ends session timing as well
    const handleLogout = async () => {
        if(activeTimer) {
           await handleStopWork();
        }
        logout();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Employee Workspace</h2>
                <div>
                    <span style={{ marginRight: '20px', fontWeight: 'bold' }}>Logged in as: {user?.name}</span>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>End Day & Logout</button>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Project & Task Selection Pane */}
                <div style={{ flex: '1', padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px', background: '#f8f9fa' }}>
                    <h3>1. Select Your Project</h3>
                    <select 
                        value={selectedProject} 
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                        <option value="">-- Choose a Project --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {selectedProject && (
                        <>
                            <h3>2. Select Your Task</h3>
                            {tasks.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {tasks.map(task => (
                                        <li key={task.id} style={{ padding: '15px', background: '#fff', border: '1px solid #dee2e6', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{task.task_name}</span>
                                            <button 
                                                onClick={() => handleStartWork(task.id, task.task_name)}
                                                disabled={activeTimer?.taskId === task.id}
                                                style={{ padding: '6px 12px', background: activeTimer?.taskId === task.id ? '#6c757d' : '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: activeTimer?.taskId === task.id ? 'not-allowed' : 'pointer' }}
                                            >
                                                {activeTimer?.taskId === task.id ? 'Working...' : 'Start'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ color: '#6c757d' }}>No pending tasks available for this project. Check with admin.</p>
                            )}
                        </>
                    )}
                </div>

                {/* Active Work Pane */}
                <div style={{ flex: '1', padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px', background: activeTimer ? '#e2f0d9' : '#fff' }}>
                    <h3>Current Status</h3>
                    {activeTimer ? (
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <div style={{ display: 'inline-block', width: '20px', height: '20px', background: '#28a745', borderRadius: '50%', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}></div>
                            <h2 style={{ color: '#28a745' }}>Recording Time</h2>
                            <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Working on: <b>{activeTimer.taskName}</b></p>
                            <p style={{ color: '#6c757d' }}>Started at: {new Date(activeTimer.startTime).toLocaleTimeString()}</p>
                            <br />
                            <button onClick={handleStopWork} style={{ padding: '12px 30px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.1rem' }}>
                                Stop Timer (Switch Task)
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '40px', color: '#6c757d' }}>
                            <div style={{ display: 'inline-block', width: '20px', height: '20px', background: '#dc3545', borderRadius: '50%', marginBottom: '10px' }}></div>
                            <h2>Idle</h2>
                            <p>You are not currently logging time tracking data.</p>
                            <p>Select a project and task on the left to begin.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* CSS Animation for pulse effect */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default EmployeeDashboard;
