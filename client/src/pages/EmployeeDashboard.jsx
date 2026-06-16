import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';

const EmployeeDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    
    // Core states
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // Overview States
    const [stats, setStats] = useState({
        active_projects: 0,
        employees_working: 0,
        total_hours_today: 0,
        site_visits_today: 0,
        completed_tasks: 0
    });
    const [liveEmployees, setLiveEmployees] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // Time tracking
    const [activeLog, setActiveLog] = useState(null);
    const [loginTime, setLoginTime] = useState(null);
    const [workedSecondsBase, setWorkedSecondsBase] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [totalSecondsToday, setTotalSecondsToday] = useState(0);
    const [projectTimerSeconds, setProjectTimerSeconds] = useState(0);
    const [projectBreakdown, setProjectBreakdown] = useState([]);
    const timerInterval = useRef(null);
    const projectTimerInterval = useRef(null);

    // Site visit & Announcements
    const [announcements, setAnnouncements] = useState([]);
    const [siteVisits, setSiteVisits] = useState([]);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [visitTime, setVisitTime] = useState(new Date().toTimeString().slice(0, 5));
    const [visitMom, setVisitMom] = useState('');
    const [visitLoading, setVisitLoading] = useState(false);

    // Project creation modal
    const [showProjModal, setShowProjModal] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [newProjLocation, setNewProjLocation] = useState('');
    const [newProjContact, setNewProjContact] = useState('');
    const [newProjStartDate, setNewProjStartDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Data fetching ---

    useEffect(() => {
        fetchProjects();
        fetchActiveTimer();
        fetchTodayTime();
        fetchProjectBreakdown();
        loadDashboard();

        const interval = setInterval(loadDashboard, 15000);

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (projectTimerInterval.current) clearInterval(projectTimerInterval.current);
            clearInterval(interval);
        };
    }, []);

    // Refresh tasks and details when selected project changes (for checklist/visits/announcements)
    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectDetails(selectedProjectId);
        } else {
            setTasks([]);
            setAnnouncements([]);
            setSiteVisits([]);
        }
    }, [selectedProjectId]);

    const loadDashboard = async () => {
        try {
            const res = await API.get('/users/dashboard');
            setStats(res.data.stats);
            setLiveEmployees(res.data.live_employees);
            setNotifications(res.data.notifications);
        } catch (e) {
            console.error('Failed to load dashboard statistics', e);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await API.get('/projects');
            setProjects(res.data);
        } catch (e) {
            console.error('Failed to load projects', e);
        }
    };

    const fetchActiveTimer = async () => {
        try {
            const res = await API.get('/time/active');
            const active = res.data;
            setActiveLog(active);
            if (active && active.project_id) {
                setSelectedProjectId(active.project_id);
            }
        } catch (e) {
            console.error('Failed to fetch active timer', e);
        }
    };

    const fetchTodayTime = async () => {
        try {
            const res = await API.get('/time/today');
            const { total_seconds, login_time, worked_seconds, is_logged_in } = res.data;
            if (login_time) {
                setLoginTime(login_time);
            }
            setWorkedSecondsBase(worked_seconds || 0);
            setIsLoggedIn(is_logged_in || false);
            setTotalSecondsToday(total_seconds || 0);
        } catch (e) {
            console.error('Failed to fetch today time', e);
        }
    };

    const fetchProjectBreakdown = async () => {
        try {
            const res = await API.get('/time/my-projects-today');
            setProjectBreakdown(res.data);
        } catch (e) {
            console.error('Failed to fetch project breakdown', e);
        }
    };

    const fetchProjectDetails = async (projId) => {
        try {
            // Tasks
            const tasksRes = await API.get(`/projects/${projId}/tasks`);
            setTasks(tasksRes.data);

            // Announcements
            const annRes = await API.get(`/projects/${projId}/announcements`);
            setAnnouncements(annRes.data);

            // Site visits
            const visitRes = await API.get(`/projects/${projId}/site-visits`);
            setSiteVisits(visitRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    // --- Shift Timer ---
    useEffect(() => {
        if (timerInterval.current) clearInterval(timerInterval.current);

        if (isLoggedIn && loginTime) {
            const getElapsed = () => {
                const elapsedSinceLogin = Math.floor((Date.now() - new Date(loginTime).getTime()) / 1000);
                return workedSecondsBase + Math.max(0, elapsedSinceLogin);
            };

            setTotalSecondsToday(getElapsed());

            timerInterval.current = setInterval(() => {
                setTotalSecondsToday(getElapsed());
            }, 1000);
        } else {
            setTotalSecondsToday(workedSecondsBase);
        }

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [isLoggedIn, loginTime, workedSecondsBase]);

    // --- Project Timer (ticks from activeLog.start_time) ---
    useEffect(() => {
        if (projectTimerInterval.current) clearInterval(projectTimerInterval.current);

        if (activeLog && activeLog.start_time) {
            // Calculate immediately
            setProjectTimerSeconds(Math.floor((Date.now() - new Date(activeLog.start_time).getTime()) / 1000));

            projectTimerInterval.current = setInterval(() => {
                setProjectTimerSeconds(Math.floor((Date.now() - new Date(activeLog.start_time).getTime()) / 1000));
            }, 1000);
        } else {
            setProjectTimerSeconds(0);
        }

        return () => {
            if (projectTimerInterval.current) clearInterval(projectTimerInterval.current);
        };
    }, [activeLog]);

    // --- Handlers ---

    const handleDropdownProjectChange = async (projectId) => {
        setSelectedProjectId(projectId);
        if (!projectId) {
            await handleStopProject(true);
            return;
        }
        try {
            const res = await API.post('/time/switch', { projectId });
            setActiveLog(res.data);
            fetchProjectBreakdown();
        } catch (e) {
            alert('Failed to switch project');
        }
    };

    const handleStopProject = async (silent = false) => {
        try {
            const res = await API.post('/time/stop-project');
            setActiveLog(null);
            setSelectedProjectId("");
            if (!silent) {
                alert(res.data.message || 'Project work stopped. You are now idle.');
            }
            fetchProjectBreakdown();
        } catch (e) {
            if (!silent) {
                alert('Failed to stop project work');
            }
        }
    };

    const handleTaskStatusChange = async (taskId, currentStatus) => {
        let newStatus = 'Pending';
        if (currentStatus === 'Pending') newStatus = 'In Progress';
        else if (currentStatus === 'In Progress') newStatus = 'Completed';
        
        try {
            await API.put(`/tasks/${taskId}`, { status: newStatus });
            if (selectedProjectId) fetchProjectDetails(selectedProjectId);
        } catch (e) {
            alert('Failed to update task status');
        }
    };

    const handleReadAnnouncement = async (annId, isRead) => {
        if (isRead) return;
        try {
            await API.post(`/announcements/${annId}/read`);
            if (selectedProjectId) fetchProjectDetails(selectedProjectId);
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    const handleLogSiteVisit = async (e) => {
        e.preventDefault();
        if (!selectedProjectId) {
            alert('Please select a project first!');
            return;
        }
        if (!visitMom.trim()) {
            alert('Please enter MOM observations.');
            return;
        }
        setVisitLoading(true);
        try {
            await API.post(`/projects/${selectedProjectId}/site-visits`, {
                visit_date: visitDate,
                visit_time: visitTime,
                mom: visitMom
            });
            setVisitMom('');
            alert('Site visit logged successfully.');
            fetchProjectDetails(selectedProjectId);
        } catch (e) {
            alert('Failed to log site visit');
        } finally {
            setVisitLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjName.trim()) return;
        try {
            await API.post('/projects', {
                name: newProjName,
                location: newProjLocation,
                site_engineer_contact: newProjContact,
                start_date: newProjStartDate
            });
            alert('Project created successfully!');
            setShowProjModal(false);
            setNewProjName('');
            setNewProjLocation('');
            setNewProjContact('');
            fetchProjects();
        } catch (e) {
            alert('Failed to create project');
        }
    };

    // --- Formatting helpers ---

    const formatTime = (totalSecs) => {
        const s = Math.max(0, totalSecs);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatMinutes = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.round(totalMins % 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <div>
                        <div className="brand-logo">KINETIC</div>
                        <div className="brand-subtitle">Employee Panel</div>
                    </div>
                </div>

                <nav className="nav-menu">
                    <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <span>Overview</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'workspace' ? 'active' : ''}`} onClick={() => setActiveTab('workspace')}>
                        <span>Workspace</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'site-visits' ? 'active' : ''}`} onClick={() => setActiveTab('site-visits')}>
                        <span>Log Site Visit</span>
                    </div>
                    <div className="nav-item" onClick={() => setShowProjModal(true)}>
                        <span>+ Create Project</span>
                    </div>
                </nav>

                <div className="user-profile-widget">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">Architectural Staff</span>
                    </div>
                    <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="main-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', margin: '0' }}>Welcome, {user?.name}</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Log tasks, log visits, and switch projects seamlessly.</p>
                    </div>

                    {/* Today's Ticking Timer */}
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', borderColor: 'var(--accent-secondary)' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Shift Timer Today</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                                {formatTime(totalSecondsToday)}
                            </div>
                        </div>
                        <div className="status-bulb online" />
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="glass-card stat-card info">
                                <span className="stat-label">Active Projects</span>
                                <span className="stat-value">{stats.active_projects}</span>
                            </div>
                            <div className="glass-card stat-card success">
                                <span className="stat-label">Live Active Staff</span>
                                <span className="stat-value">{stats.employees_working}</span>
                            </div>
                            <div className="glass-card stat-card warning">
                                <span className="stat-label">Hours Logged Today</span>
                                <span className="stat-value">{stats.total_hours_today} hrs</span>
                            </div>
                            <div className="glass-card stat-card success">
                                <span className="stat-label">Site Visits Today</span>
                                <span className="stat-value">{stats.site_visits_today}</span>
                            </div>
                            <div className="glass-card stat-card info">
                                <span className="stat-label">Completed Tasks</span>
                                <span className="stat-value">{stats.completed_tasks}</span>
                            </div>
                        </div>

                        {/* Live Activity & Notifications */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                            {/* Live Employee Panel */}
                            <section className="glass-card" style={{ flex: 1 }}>
                                <h3 style={{ marginBottom: '20px' }}>Live Employee Status</h3>
                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Staff Member</th>
                                                <th>Activity Status</th>
                                                <th>Current Project</th>
                                                <th>Time Today</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {liveEmployees.map(emp => (
                                                <tr key={emp.id}>
                                                    <td>
                                                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{emp.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className={`status-bulb ${emp.is_working ? 'online' : 'offline'}`} />
                                                            <span style={{ fontSize: '13px' }}>{emp.is_working ? 'Working' : 'Offline'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                         {emp.current_project ? (
                                                             <div>
                                                                 <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{emp.current_project}</div>
                                                                 {emp.current_task && (
                                                                     <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                         Task: <span style={{ color: 'var(--accent-secondary, #06b6d4)' }}>{emp.current_task}</span>
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         ) : (
                                                             '--'
                                                         )}
                                                    </td>
                                                    <td>{emp.total_hours_today} hrs</td>
                                                </tr>
                                            ))}
                                            {liveEmployees.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No employee accounts set up.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Notifications panel */}
                            <section className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginBottom: '20px' }}>Recent Activity Logs</h3>
                                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                                    {notifications.map(n => (
                                        <div key={n.id} className="notification-item">
                                            <div className="notification-icon">
                                                {n.type === 'login' ? '🟢' : n.type === 'logout' ? '🔴' : '📢'}
                                            </div>
                                            <div>
                                                <div>{n.message}</div>
                                                <div className="notification-time">{new Date(n.created_at).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <p style={{ padding: '16px', color: 'var(--text-secondary)' }}>No recent activity logged.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {/* Main Dashboard Grid */}
                {activeTab === 'workspace' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                        
                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Project Switcher */}
                            <section className="glass-card">
                                <h3 style={{ marginBottom: '20px' }}>Project Switcher</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: activeLog ? '1fr auto' : '1fr', gap: '16px', alignItems: 'end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Select Project</label>
                                        <select 
                                            className="form-select"
                                            value={selectedProjectId}
                                            onChange={e => handleDropdownProjectChange(e.target.value)}
                                        >
                                            <option value="">-- Choose a Project --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {activeLog && (
                                        <button type="button" onClick={() => handleStopProject(false)} className="btn btn-danger">
                                            Stop Project Work
                                        </button>
                                    )}
                                </div>

                                {activeLog && (
                                    <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            Currently working on: <strong>{activeLog.project_name || 'Unknown Project'}</strong>
                                            <span style={{ marginLeft: '12px', color: 'var(--color-success)' }}>(Active since {new Date(activeLog.start_time).toLocaleTimeString()})</span>
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                                            {formatTime(projectTimerSeconds)}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Today's Project Breakdown */}
                            <section className="glass-card">
                                <h3 style={{ marginBottom: '20px' }}>Today's Project Breakdown</h3>
                                {projectBreakdown.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>No project time logged today yet.</p>
                                ) : (
                                    <div className="table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Project Name</th>
                                                    <th>Time Spent</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projectBreakdown.map(pb => (
                                                    <tr key={pb.project_id}>
                                                        <td>{pb.project_name}</td>
                                                        <td>{formatMinutes(pb.total_minutes)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {/* Checklist */}
                            {selectedProjectId && (
                                <section className="glass-card">
                                    <h3 style={{ marginBottom: '20px' }}>Project Checklist</h3>
                                    {tasks.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)' }}>No checklist tasks set up for this project yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {tasks.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => handleTaskStatusChange(t.id, t.status)}
                                                    className={`task-checkbox-container ${t.status === 'Completed' ? 'completed' : t.status === 'In Progress' ? 'in-progress' : ''}`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={t.status === 'Completed'} 
                                                        onChange={() => {}} // Handle parent click
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span style={{ flex: 1, textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                                                        {t.task_name}
                                                    </span>
                                                    <span className={`status-pill ${t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'warning' : 'info'}`}>
                                                        {t.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Right Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Project Announcements Widget */}
                            <section className="glass-card">
                                <h3 style={{ marginBottom: '20px' }}>Announcements Feed</h3>
                                {!selectedProjectId ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>Select a project to view announcements.</p>
                                ) : announcements.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>No announcements posted for this project.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {announcements.map(ann => (
                                            <div 
                                                key={ann.id} 
                                                onClick={() => handleReadAnnouncement(ann.id, ann.is_read)}
                                                style={{
                                                    padding: '16px',
                                                    background: 'var(--bg-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {!ann.is_read && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '16px',
                                                        right: '16px',
                                                        width: '8px',
                                                        height: '8px',
                                                        background: 'var(--color-danger)',
                                                        borderRadius: '50%',
                                                        boxShadow: '0 0 6px var(--color-danger)'
                                                    }} />
                                                )}
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                                    Posted by <strong>{ann.author_name}</strong> &bull; {new Date(ann.created_at).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                                    {ann.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}

                {/* Log Site Visit Tab */}
                {activeTab === 'site-visits' && (
                    <section className="glass-card">
                        <h3 style={{ marginBottom: '20px' }}>Log Site Visit Observations</h3>
                        
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label className="form-label">Select Project</label>
                            <select 
                                className="form-select"
                                value={selectedProjectId}
                                onChange={e => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">-- Choose a Project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedProjectId ? (
                            <>
                                <form onSubmit={handleLogSiteVisit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Visit Date</label>
                                        <input 
                                            type="date" 
                                            className="form-input"
                                            value={visitDate}
                                            onChange={e => setVisitDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Arrival Time</label>
                                        <input 
                                            type="time" 
                                            className="form-input"
                                            value={visitTime}
                                            onChange={e => setVisitTime(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Minutes of Meeting (MOM)</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="Write observations..."
                                            value={visitMom}
                                            onChange={e => setVisitMom(e.target.value)}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={visitLoading}>
                                        {visitLoading ? 'Logging...' : 'Submit'}
                                    </button>
                                </form>

                                <h4>Site Visit Logs for this Project</h4>
                                <div className="table-container" style={{ marginTop: '16px' }}>
                                    {siteVisits.length === 0 ? (
                                        <p style={{ padding: '16px', color: 'var(--text-secondary)' }}>No site visits logged yet.</p>
                                    ) : (
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Logged By</th>
                                                    <th>Minutes of Meeting</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {siteVisits.map(v => (
                                                    <tr key={v.id}>
                                                        <td>{new Date(v.visit_date).toISOString().split('T')[0]}</td>
                                                        <td>{v.visit_time}</td>
                                                        <td>{v.employee_name}</td>
                                                        <td>{v.mom}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)' }}>Please select a project first to log site visits and view past observations.</p>
                        )}
                    </section>
                )}

                {/* Create Project Modal */}
                {showProjModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: '20px' }}>Create New Project</h3>
                            <form onSubmit={handleCreateProject}>
                                <div className="form-group">
                                    <label className="form-label">Project Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input" 
                                        placeholder="e.g. Skyline Apartments"
                                        value={newProjName}
                                        onChange={e => setNewProjName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="City, Country"
                                        value={newProjLocation}
                                        onChange={e => setNewProjLocation(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site Contact Details</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Phone or Name"
                                        value={newProjContact}
                                        onChange={e => setNewProjContact(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={newProjStartDate}
                                        onChange={e => setNewProjStartDate(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowProjModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EmployeeDashboard;
