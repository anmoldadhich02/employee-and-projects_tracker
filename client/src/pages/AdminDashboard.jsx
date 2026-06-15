import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const isAdmin = user?.role === 'Admin'; // Only Owner Admin has full privileges
    
    // Active Tab
    const [activeTab, setActiveTab] = useState('overview');

    // Dashboard Stats
    const [stats, setStats] = useState({
        active_projects: 0,
        employees_working: 0,
        total_hours_today: 0,
        site_visits_today: 0,
        completed_tasks: 0
    });
    const [liveEmployees, setLiveEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // Tab Data
    const [employees, setEmployees] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);
    const [allSiteVisits, setAllSiteVisits] = useState([]);

    // Forms & Modals
    const [showProjModal, setShowProjModal] = useState(false);
    const [projName, setProjName] = useState('');
    const [projLocation, setProjLocation] = useState('');
    const [projContact, setProjContact] = useState('');
    const [projStartDate, setProjStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [assignedEmps, setAssignedEmps] = useState([]);

    // Manage Checklist Modal
    const [showChecklistModal, setShowChecklistModal] = useState(false);
    const [checklistProjId, setChecklistProjId] = useState('');
    const [projectTasks, setProjectTasks] = useState([]);
    const [newTaskName, setNewTaskName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    // Templates Form
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateTasks, setNewTemplateTasks] = useState('');

    // Employee Form
    const [empName, setEmpName] = useState('');
    const [empEmail, setEmpEmail] = useState('');
    const [empPhone, setEmpPhone] = useState('');
    const [empDesignation, setEmpDesignation] = useState('');
    const [empPassword, setEmpPassword] = useState('');
    const [empRole, setEmpRole] = useState('Employee');

    // Site Visit Edit Modal
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [editVisitDate, setEditVisitDate] = useState('');
    const [editVisitTime, setEditVisitTime] = useState('');
    const [editVisitMom, setEditVisitMom] = useState('');

    // Announcements Form
    const [annProjectId, setAnnProjectId] = useState('');
    const [annContent, setAnnContent] = useState('');

    useEffect(() => {
        loadDashboard();
        loadEmployees();
        loadTemplates();
        loadSiteVisits();
        
        // Auto-refresh stats every 15 seconds to simulate real-time updates
        const interval = setInterval(loadDashboard, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await API.get('/users/dashboard');
            setStats(res.data.stats);
            setLiveEmployees(res.data.live_employees);
            setProjects(res.data.projects);
            setNotifications(res.data.notifications);
        } catch (e) {
            console.error('Failed to load dashboard statistics', e);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await API.get('/users');
            setEmployees(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await API.get('/checklists');
            setChecklistTemplates(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadSiteVisits = async () => {
        try {
            // Fetch site visits for all projects
            // We can get them by fetching all projects then querying visits,
            // or we use the reporting endpoint but as JSON.
            // Since we only have project-wise site visit fetch, let's fetch for the active projects
            const projectsRes = await API.get('/projects');
            let allVisits = [];
            for (let p of projectsRes.data) {
                const visitsRes = await API.get(`/projects/${p.id}/site-visits`);
                const visitsWithProjName = visitsRes.data.map(v => ({ ...v, project_name: p.name }));
                allVisits = [...allVisits, ...visitsWithProjName];
            }
            // Sort by date descending
            allVisits.sort((a,b) => new Date(b.visit_date + 'T' + b.visit_time) - new Date(a.visit_date + 'T' + a.visit_time));
            setAllSiteVisits(allVisits);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await API.post('/projects', {
                name: projName,
                location: projLocation,
                site_engineer_contact: projContact,
                start_date: projStartDate,
                assigned_employees: assignedEmps
            });
            alert('Project created successfully!');
            setShowProjModal(false);
            setProjName('');
            setProjLocation('');
            setProjContact('');
            setAssignedEmps([]);
            loadDashboard();
        } catch (e) {
            alert('Failed to create project');
        }
    };

    const handleUpdateProjectProgress = async (id, progress) => {
        try {
            await API.put(`/projects/${id}`, { progress_percentage: parseInt(progress) });
            loadDashboard();
        } catch (e) {
            alert('Failed to update project progress');
        }
    };

    const handleUpdateProjectStatus = async (id, status) => {
        try {
            await API.put(`/projects/${id}`, { status });
            loadDashboard();
        } catch (e) {
            alert('Failed to update project status');
        }
    };

    const handleOpenChecklistModal = async (projId) => {
        setChecklistProjId(projId);
        try {
            const res = await API.get(`/projects/${projId}/tasks`);
            setProjectTasks(res.data);
            setShowChecklistModal(true);
        } catch (e) {
            alert('Failed to load project tasks');
        }
    };

    const handleAddTaskToChecklist = async (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;
        try {
            await API.post(`/projects/${checklistProjId}/tasks`, {
                tasks: [newTaskName]
            });
            setNewTaskName('');
            // Reload tasks
            const res = await API.get(`/projects/${checklistProjId}/tasks`);
            setProjectTasks(res.data);
        } catch (e) {
            alert('Failed to add task');
        }
    };

    const handleLoadTemplateToChecklist = async (e) => {
        e.preventDefault();
        if (!selectedTemplateId) return;
        try {
            await API.post(`/projects/${checklistProjId}/tasks`, {
                templateId: selectedTemplateId
            });
            setSelectedTemplateId('');
            // Reload tasks
            const res = await API.get(`/projects/${checklistProjId}/tasks`);
            setProjectTasks(res.data);
            alert('Template applied successfully!');
        } catch (e) {
            alert('Failed to apply template');
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (!newTemplateName.trim()) return;
        const tasksArr = newTemplateTasks.split(',').map(t => t.trim()).filter(t => t.length > 0);
        try {
            await API.post('/checklists', {
                name: newTemplateName,
                tasks: tasksArr
            });
            alert('Checklist template saved!');
            setNewTemplateName('');
            setNewTemplateTasks('');
            loadTemplates();
        } catch (e) {
            alert('Failed to create template');
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await API.post('/users', {
                name: empName,
                email: empEmail,
                phone_number: empPhone,
                designation: empDesignation,
                password: empPassword,
                role: empRole
            });
            alert('Employee registered successfully!');
            setEmpName('');
            setEmpEmail('');
            setEmpPhone('');
            setEmpDesignation('');
            setEmpPassword('');
            setEmpRole('Employee');
            loadEmployees();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to register employee');
        }
    };

    const handleToggleEmpStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Working' ? 'Inactive' : 'Working';
        try {
            await API.put(`/users/${id}/status`, { status: newStatus });
            alert(`Employee account marked as ${newStatus}`);
            loadEmployees();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to toggle employee status');
        }
    };

    const handleToggleEmpRole = async (id, currentRole) => {
        if (!isAdmin) {
            alert('Only the owner Admin can change user roles.');
            return;
        }
        const newRole = currentRole === 'Secondary Admin' ? 'Employee' : 'Secondary Admin';
        const msg = currentRole === 'Secondary Admin' 
            ? 'Are you sure you want to remove Super Admin privileges?' 
            : 'Are you sure you want to promote this employee to Super Admin?';
        
        if (!window.confirm(msg)) return;

        try {
            await API.put(`/users/${id}/role`, { role: newRole });
            alert(`User role updated to ${newRole === 'Secondary Admin' ? 'Super Admin' : 'Employee'}`);
            loadEmployees();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to change user role');
        }
    };

    const handleResetPassword = async (id) => {
        if (!isAdmin) {
            alert('Only the owner Admin can reset passwords.');
            return;
        }
        const newPass = window.prompt('Enter new password (minimum 4 characters):');
        if (newPass === null) return; // Cancelled
        if (newPass.trim().length < 4) {
            alert('Password too short!');
            return;
        }
        try {
            await API.put(`/users/${id}/reset-password`, { password: newPass });
            alert('Password reset successfully!');
        } catch (e) {
            alert('Failed to reset password');
        }
    };

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!annProjectId || !annContent.trim()) {
            alert('Please select project and write content.');
            return;
        }
        try {
            await API.post(`/projects/${annProjectId}/announcements`, { content: annContent });
            alert('Announcement posted!');
            setAnnProjectId('');
            setAnnContent('');
            loadDashboard();
        } catch (e) {
            alert('Failed to post announcement');
        }
    };

    const handleOpenEditVisit = (visit) => {
        setEditingVisit(visit);
        setEditVisitDate(new Date(visit.visit_date).toISOString().split('T')[0]);
        setEditVisitTime(visit.visit_time.slice(0, 5));
        setEditVisitMom(visit.mom);
        setShowVisitModal(true);
    };

    const handleUpdateSiteVisit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/site-visits/${editingVisit.id}`, {
                visit_date: editVisitDate,
                visit_time: editVisitTime,
                mom: editVisitMom
            });
            alert('Site visit updated.');
            setShowVisitModal(false);
            loadSiteVisits();
        } catch (e) {
            alert('Failed to update site visit');
        }
    };

    const handleDeleteSiteVisit = async (visitId) => {
        if (!window.confirm('Are you sure you want to delete this site visit log?')) return;
        try {
            await API.delete(`/site-visits/${visitId}`);
            alert('Site visit deleted.');
            loadSiteVisits();
        } catch (e) {
            alert('Failed to delete site visit');
        }
    };

    const handleDownloadReport = async (reportType) => {
        try {
            const response = await API.get(`/reports/${reportType}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_report.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            alert('Failed to download report');
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="brand">
                    <div>
                        <div className="brand-logo">KINETIC</div>
                        <div className="brand-subtitle">Console</div>
                    </div>
                </div>

                <nav className="nav-menu">
                    <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <span>Overview</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                        <span>Project Master</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
                        <span>Employee Master</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
                        <span>Checklist Templates</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}>
                        <span>Site Visits Log</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
                        <span>Announcements</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                        <span>Export Reports</span>
                    </div>
                </nav>

                <div className="user-profile-widget">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role === 'Admin' ? 'Owner Admin' : 'Super Admin'}</span>
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
                        <h1 style={{ fontSize: '32px', margin: 0, textTransform: 'capitalize' }}>
                            {activeTab} Management
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={loadDashboard} className="btn btn-secondary">
                            Refresh Data
                        </button>
                        {activeTab === 'projects' && (
                            <button onClick={() => setShowProjModal(true)} className="btn btn-primary">
                                + Add Project
                            </button>
                        )}
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
                                                    <td>{emp.current_project || '--'}</td>
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

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                    <section className="glass-card">
                        <h3 style={{ marginBottom: '20px' }}>All Projects Overview</h3>
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Location</th>
                                        <th>Staff Assigned</th>
                                        <th>Logged Time</th>
                                        <th>Status</th>
                                        <th>Progress Slider</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contact: {p.site_engineer_contact}</div>
                                            </td>
                                            <td>{p.location}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {p.assigned_team.map((name, i) => (
                                                        <span key={i} className="status-pill info" style={{ fontSize: '11px', padding: '2px 6px' }}>{name}</span>
                                                    ))}
                                                    {p.assigned_team.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                                                </div>
                                            </td>
                                            <td>{p.total_hours} hrs</td>
                                            <td>
                                                <select 
                                                    className="form-select"
                                                    value={p.status}
                                                    onChange={e => handleUpdateProjectStatus(p.id, e.target.value)}
                                                    style={{ padding: '4px 8px', fontSize: '13px' }}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="On Hold">On Hold</option>
                                                    <option value="Closed">Closed</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100"
                                                        value={p.progress_percentage}
                                                        onChange={e => handleUpdateProjectProgress(p.id, e.target.value)}
                                                        style={{ width: '80px', cursor: 'pointer' }}
                                                    />
                                                    <span>{p.progress_percentage}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={() => handleOpenChecklistModal(p.id)} className="btn btn-secondary btn-sm">
                                                    Tasks Checklist
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* EMPLOYEES TAB */}
                {activeTab === 'employees' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                        {/* List */}
                        <section className="glass-card" style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '20px' }}>Staff Accounts</h3>
                            <div className="table-container">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.designation} &bull; {emp.email}</div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${emp.role === 'Admin' ? 'danger' : emp.role === 'Secondary Admin' ? 'warning' : 'info'}`}>
                                                        {emp.role === 'Admin' ? 'Owner Admin' : emp.role === 'Secondary Admin' ? 'Super Admin' : 'Employee'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${emp.status === 'Working' ? 'success' : 'danger'}`}>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {emp.role !== 'Admin' && (
                                                            <>
                                                                <button onClick={() => handleToggleEmpStatus(emp.id, emp.status)} className="btn btn-secondary btn-sm">
                                                                    Status
                                                                </button>
                                                                {isAdmin && (
                                                                    <button onClick={() => handleToggleEmpRole(emp.id, emp.role)} className="btn btn-secondary btn-sm">
                                                                        {emp.role === 'Secondary Admin' ? 'Demote' : 'Promote'}
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {isAdmin && (
                                                            <button onClick={() => handleResetPassword(emp.id)} className="btn btn-secondary btn-sm">
                                                                Reset
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Create form */}
                        <section className="glass-card" style={{ height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '20px' }}>Register New Employee</h3>
                            <form onSubmit={handleCreateEmployee}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input"
                                        value={empName}
                                        onChange={e => setEmpName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        className="form-input"
                                        value={empEmail}
                                        onChange={e => setEmpEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={empPhone}
                                        onChange={e => setEmpPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        placeholder="e.g. Lead Architect, Drafter"
                                        value={empDesignation}
                                        onChange={e => setEmpDesignation(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Initial Password</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className="form-input"
                                        value={empPassword}
                                        onChange={e => setEmpPassword(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Role</label>
                                    <select 
                                        className="form-select"
                                        value={empRole}
                                        onChange={e => setEmpRole(e.target.value)}
                                    >
                                        <option value="Employee">Employee (Normal)</option>
                                        <option value="Secondary Admin">Super Admin (Secondary)</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    Register Employee
                                </button>
                            </form>
                        </section>
                    </div>
                )}

                {/* TEMPLATES TAB */}
                {activeTab === 'templates' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                        {/* List */}
                        <section className="glass-card" style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '20px' }}>Blueprints & Checklists</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {checklistTemplates.map(temp => (
                                    <div 
                                        key={temp.id} 
                                        style={{
                                            padding: '16px',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{temp.name}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {temp.tasks.map((task, i) => (
                                                <span key={i} className="status-pill info" style={{ fontSize: '12px' }}>{task}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {checklistTemplates.length === 0 && (
                                    <p style={{ color: 'var(--text-secondary)' }}>No templates saved yet.</p>
                                )}
                            </div>
                        </section>

                        {/* Create Form */}
                        <section className="glass-card" style={{ height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '20px' }}>Save New Template</h3>
                            <form onSubmit={handleCreateTemplate}>
                                <div className="form-group">
                                    <label className="form-label">Template Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input" 
                                        placeholder="e.g. Residential Project Phase 1"
                                        value={newTemplateName}
                                        onChange={e => setNewTemplateName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Checklist Items (comma-separated)</label>
                                    <textarea 
                                        required 
                                        rows="4"
                                        className="form-textarea" 
                                        placeholder="e.g. Site Survey, Client Briefing, Rough Drafts, Final Approvals"
                                        value={newTemplateTasks}
                                        onChange={e => setNewTemplateTasks(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    Save Template
                                </button>
                            </form>
                        </section>
                    </div>
                )}

                {/* SITE VISITS LOG TAB */}
                {activeTab === 'visits' && (
                    <section className="glass-card">
                        <h3 style={{ marginBottom: '20px' }}>Chronological Site Visits Log</h3>
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Project</th>
                                        <th>Staff Member</th>
                                        <th>Observations & Observations (MOM)</th>
                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allSiteVisits.map(v => (
                                        <tr key={v.id}>
                                            <td>{new Date(v.visit_date).toISOString().split('T')[0]}</td>
                                            <td>{v.visit_time.slice(0, 5)}</td>
                                            <td><strong>{v.project_name}</strong></td>
                                            <td>{v.employee_name}</td>
                                            <td>{v.mom}</td>
                                            {isAdmin && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleOpenEditVisit(v)} className="btn btn-secondary btn-sm">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteSiteVisit(v.id)} className="btn btn-danger btn-sm">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {allSiteVisits.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textCenter: 'center', padding: '24px' }}>No site visits logged.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ANNOUNCEMENTS TAB */}
                {activeTab === 'announcements' && (
                    <section className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>Post New Project Announcement</h3>
                        <form onSubmit={handlePostAnnouncement}>
                            <div className="form-group">
                                <label className="form-label">Target Project</label>
                                <select 
                                    className="form-select"
                                    required
                                    value={annProjectId}
                                    onChange={e => setAnnProjectId(e.target.value)}
                                >
                                    <option value="">-- Choose Project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label">Announcement Content</label>
                                <textarea 
                                    required 
                                    rows="5"
                                    className="form-textarea" 
                                    placeholder="Write instructions, notices, deadlines, or comments here..."
                                    value={annContent}
                                    onChange={e => setAnnContent(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Publish Announcement
                            </button>
                        </form>
                    </section>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <section className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '12px' }}>Operational Excel/CSV Exports</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                            Generate and download real-time, tab-separated CSV logs ready for audit, accounting, and presentation.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div 
                                onClick={() => handleDownloadReport('projects')}
                                className="glass-card" 
                                style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)' }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                                <h4>Projects Spreadsheet</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Project specs, contacts, start dates, progress, total hours.</p>
                            </div>
                            <div 
                                onClick={() => handleDownloadReport('employees')}
                                className="glass-card" 
                                style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)' }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                                <h4>Employees Register</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Active personnel list, designation, role, total historical hours.</p>
                            </div>
                            <div 
                                onClick={() => handleDownloadReport('attendance')}
                                className="glass-card" 
                                style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)' }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                                <h4>Attendance Log</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Login/Logout punch-cards, dates, daily totals, statuses.</p>
                            </div>
                            <div 
                                onClick={() => handleDownloadReport('site-visits')}
                                className="glass-card" 
                                style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)' }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚜</div>
                                <h4>Site Observation Log</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Geographic coordinates visits, observations, MOMs, inspector names.</p>
                            </div>
                        </div>
                    </section>
                )}

                {/* PROJECT CREATION MODAL */}
                {showProjModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: '20px' }}>Register New Project</h3>
                            <form onSubmit={handleCreateProject}>
                                <div className="form-group">
                                    <label className="form-label">Project Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input" 
                                        placeholder="e.g. Skyline Towers"
                                        value={projName}
                                        onChange={e => setProjName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="City, State"
                                        value={projLocation}
                                        onChange={e => setProjLocation(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site Contact Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Site engineer contact"
                                        value={projContact}
                                        onChange={e => setProjContact(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={projStartDate}
                                        onChange={e => setProjStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Assign Team Members (Hold Cmd/Ctrl to multi-select)</label>
                                    <select 
                                        multiple 
                                        className="form-select"
                                        style={{ height: '100px' }}
                                        value={assignedEmps}
                                        onChange={e => setAssignedEmps(Array.from(e.target.selectedOptions, option => option.value))}
                                    >
                                        {employees.filter(emp => emp.role !== 'Admin').map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowProjModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TASK CHECKLIST CONFIG MODAL */}
                {showChecklistModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Manage Project Checklist</h3>
                                <button onClick={() => setShowChecklistModal(false)} className="btn btn-secondary btn-sm">Close</button>
                            </div>
                            
                            {/* Current Checklist */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                {projectTasks.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No tasks in checklist.</p>
                                ) : (
                                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {projectTasks.map(t => (
                                            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                                <span>{t.task_name}</span>
                                                <span className={`status-pill ${t.status === 'Completed' ? 'success' : 'info'}`}>{t.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Add Single Task */}
                            <form onSubmit={handleAddTaskToChecklist} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <input 
                                    type="text" 
                                    required 
                                    className="form-input" 
                                    style={{ flex: 1 }}
                                    placeholder="Add manual task..."
                                    value={newTaskName}
                                    onChange={e => setNewTaskName(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">Add</button>
                            </form>

                            <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

                            {/* Apply Template */}
                            <form onSubmit={handleLoadTemplateToChecklist}>
                                <div className="form-group">
                                    <label className="form-label">Apply Existing Checklist Template</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select 
                                            className="form-select"
                                            style={{ flex: 1 }}
                                            value={selectedTemplateId}
                                            onChange={e => setSelectedTemplateId(e.target.value)}
                                        >
                                            <option value="">-- Choose Template --</option>
                                            {checklistTemplates.map(temp => (
                                                <option key={temp.id} value={temp.id}>{temp.name} ({temp.tasks.length} tasks)</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="btn btn-success" disabled={!selectedTemplateId}>
                                            Apply Template
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT SITE VISIT MODAL */}
                {showVisitModal && editingVisit && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: '20px' }}>Edit Site Visit Observation</h3>
                            <form onSubmit={handleUpdateSiteVisit}>
                                <div className="form-group">
                                    <label className="form-label">Visit Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="form-input"
                                        value={editVisitDate}
                                        onChange={e => setEditVisitDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Visit Time</label>
                                    <input 
                                        type="time" 
                                        required 
                                        className="form-input"
                                        value={editVisitTime}
                                        onChange={e => setEditVisitTime(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label">Observations / MOM</label>
                                    <textarea 
                                        required 
                                        rows="4"
                                        className="form-textarea"
                                        value={editVisitMom}
                                        onChange={e => setEditVisitMom(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowVisitModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
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

export default AdminDashboard;
