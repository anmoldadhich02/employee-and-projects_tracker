import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';
import logoImg from '../assets/logo.png';

const getBackendUrl = () => {
    return API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:5001';
};

const getBackendUrl = () => {
    return API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:5001';
};

const SuperAdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const isAdmin = user?.role === 'Admin'; // Only Owner Admin has full privileges
    
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
    const [currentSessionStart, setCurrentSessionStart] = useState(null);
    const [workedSecondsBase, setWorkedSecondsBase] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [totalSecondsToday, setTotalSecondsToday] = useState(0);
    const [projectTimerSeconds, setProjectTimerSeconds] = useState(0);
    const [projectBreakdown, setProjectBreakdown] = useState([]);
    const timerInterval = useRef(null);
    const projectTimerInterval = useRef(null);

    // Site visit & Announcements
    const [announcements, setAnnouncements] = useState([]);
    const [expandedReads, setExpandedReads] = useState({});
    const [siteVisits, setSiteVisits] = useState([]);
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [visitTime, setVisitTime] = useState(new Date().toTimeString().slice(0, 5));
    const [visitMom, setVisitMom] = useState('');
    const [visitLoading, setVisitLoading] = useState(false);
    const [visitPhotos, setVisitPhotos] = useState([]);

    // Site Visit Edit Modal
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [editVisitDate, setEditVisitDate] = useState('');
    const [editVisitTime, setEditVisitTime] = useState('');
    const [editVisitMom, setEditVisitMom] = useState('');
    const [deletedPhotos, setDeletedPhotos] = useState([]);
    const [editPhotos, setEditPhotos] = useState([]);
    const [viewingAnn, setViewingAnn] = useState(null);
    const [showAnnModal, setShowAnnModal] = useState(false);
    const [modalReads, setModalReads] = useState([]);
    const [showModalReads, setShowModalReads] = useState(false);
    const [personalTasks, setPersonalTasks] = useState([]);
    const [showAddInput, setShowAddInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [tickingTasks, setTickingTasks] = useState([]);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState('');
    
    // Announcements tab state
    const [annProjectId, setAnnProjectId] = useState('');
    const [annContent, setAnnContent] = useState('');

    // Project creation modal
    const [showProjModal, setShowProjModal] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [newProjLocation, setNewProjLocation] = useState('');
    const [newProjContact, setNewProjContact] = useState('');
    const [newProjStartDate, setNewProjStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Manage Checklist Modal
    const [showChecklistModal, setShowChecklistModal] = useState(false);
    const [checklistProjId, setChecklistProjId] = useState('');
    const [projectTasks, setProjectTasks] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [newSubtaskName, setNewSubtaskName] = useState('');
    const [newSubtaskSheetNo, setNewSubtaskSheetNo] = useState('');
    const [activeAddSubtaskCategoryId, setActiveAddSubtaskCategoryId] = useState(null);
    const [saveTemplateName, setSaveTemplateName] = useState('');
    const [checklistTemplates, setChecklistTemplates] = useState([]);
    const [projectSearch, setProjectSearch] = useState('');

    // Site Visit Export Filters
    const [svProjectId, setSvProjectId] = useState('');
    const [svStartDate, setSvStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [svEndDate, setSvEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [showSvOptions, setShowSvOptions] = useState(false);

    // Admin Specific States
    const [employees, setEmployees] = useState([]);
    const [empName, setEmpName] = useState('');
    const [empEmail, setEmpEmail] = useState('');
    const [empPhone, setEmpPhone] = useState('');
    const [empDesignation, setEmpDesignation] = useState('');
    const [empPassword, setEmpPassword] = useState('');
    const [empRole, setEmpRole] = useState('Employee');
    const [empProfileImage, setEmpProfileImage] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [showEmpTabAttOptions, setShowEmpTabAttOptions] = useState(false);
    const [showEmpPassword, setShowEmpPassword] = useState(false);

    // Edit Employee Modal States
    const [showEditEmpModal, setShowEditEmpModal] = useState(false);
    const [editEmpId, setEditEmpId] = useState('');
    const [editEmpName, setEditEmpName] = useState('');
    const [editEmpEmail, setEditEmpEmail] = useState('');
    const [editEmpPhone, setEditEmpPhone] = useState('');
    const [editEmpDesignation, setEditEmpDesignation] = useState('');
    const [editEmpRole, setEditEmpRole] = useState('');
    const [editEmpProfileImage, setEditEmpProfileImage] = useState(null);
    const [editEmpProfileImageUrl, setEditEmpProfileImageUrl] = useState('');

    // Edit Employee Modal States
    const [showEditEmpModal, setShowEditEmpModal] = useState(false);
    const [editEmpId, setEditEmpId] = useState('');
    const [editEmpName, setEditEmpName] = useState('');
    const [editEmpEmail, setEditEmpEmail] = useState('');
    const [editEmpPhone, setEditEmpPhone] = useState('');
    const [editEmpDesignation, setEditEmpDesignation] = useState('');
    const [editEmpRole, setEditEmpRole] = useState('');
    const [editEmpProfileImage, setEditEmpProfileImage] = useState(null);
    const [editEmpProfileImageUrl, setEditEmpProfileImageUrl] = useState('');

    const [attStartDate, setAttStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [attEndDate, setAttEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [attEmployeeId, setAttEmployeeId] = useState('');
    const [showAttOptions, setShowAttOptions] = useState(false);

    // Auto-refresh (runs silently in the background)
    const REFRESH_INTERVAL = 15; // seconds
    const autoRefreshRef = useRef(null);
    const selectedProjIdRef = useRef('');

    // Update selectedProjIdRef whenever selectedProjectId changes
    useEffect(() => {
        selectedProjIdRef.current = selectedProjectId;
    }, [selectedProjectId]);

    // Full live-data refresh
    const refreshLiveData = async (projId) => {
        await loadDashboard();
        await fetchTodayTime();
        await fetchActiveTimer();
        await fetchProjectBreakdown();
        if (projId) await fetchProjectDetails(projId);
    };

    useEffect(() => {
        fetchProjects();
        loadEmployees();
        loadTemplates();
        fetchActiveTimer();
        fetchTodayTime();
        fetchProjectBreakdown();
        loadDashboard();
        loadPersonalTasks();

        // Silent auto-refresh every REFRESH_INTERVAL seconds
        autoRefreshRef.current = setInterval(() => {
            refreshLiveData(selectedProjIdRef.current);
        }, REFRESH_INTERVAL * 1000);

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
            if (projectTimerInterval.current) clearInterval(projectTimerInterval.current);
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
        };
    }, []);

    // Refresh tasks and details when selected project changes
    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectDetails(selectedProjectId);
        } else {
            setTasks([]);
            setAnnouncements([]);
            setSiteVisits([]);
        }
    }, [selectedProjectId]);

    const loadPersonalTasks = async () => {
        try {
            const res = await API.get('/personal-tasks');
            setPersonalTasks(res.data);
        } catch (e) {
            console.error('Failed to load personal tasks:', e);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        try {
            const res = await API.post('/personal-tasks', { title: newTaskTitle });
            setPersonalTasks([res.data, ...personalTasks]);
            setNewTaskTitle('');
            setShowAddInput(false);
        } catch (e) {
            console.error('Failed to add personal task:', e);
        }
    };

    const handleToggleTask = async (taskId) => {
        setTickingTasks([...tickingTasks, taskId]);
        setTimeout(async () => {
            try {
                await API.put(`/personal-tasks/${taskId}`, { completed: true });
                setPersonalTasks(prev => prev.filter(t => t.id !== taskId));
            } catch (e) {
                console.error('Failed to complete task:', e);
            } finally {
                setTickingTasks(prev => prev.filter(id => id !== taskId));
            }
        }, 400);
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await API.delete(`/personal-tasks/${taskId}`);
            setPersonalTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (e) {
            console.error('Failed to delete task:', e);
        }
    };

    const handleSaveEditTask = async (e, taskId) => {
        e.preventDefault();
        if (!editingTaskTitle.trim()) return;
        try {
            const res = await API.put(`/personal-tasks/${taskId}`, { title: editingTaskTitle });
            setPersonalTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: res.data.title } : t));
            setEditingTaskId(null);
            setEditingTaskTitle('');
        } catch (e) {
            console.error('Failed to edit task:', e);
        }
    };


    const loadDashboard = async () => {
        try {
            const res = await API.get('/users/dashboard');
            setStats(res.data.stats);
            setLiveEmployees(res.data.live_employees);
            setNotifications(res.data.notifications);
            if (res.data.projects) {
                setProjects(res.data.projects);
            }
        } catch (e) {
            console.error('Failed to load dashboard statistics', e);
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

    const fetchProjects = async () => {
        try {
            const res = await API.get('/projects');
            setProjects(res.data);
        } catch (e) {
            console.error('Failed to load projects', e);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await API.get('/users');
            setEmployees(res.data);
        } catch (e) {
            console.error('Failed to load employees list:', e);
        }
    };

    const fetchActiveTimer = async () => {
        try {
            const res = await API.get('/time/active');
            const active = res.data;
            setActiveLog(active);
            if (active && active.project_id) {
                const projIdStr = String(active.project_id);
                setSelectedProjectId(projIdStr);
                fetchProjectDetails(projIdStr);
            }
        } catch (e) {
            console.error('Failed to fetch active timer', e);
        }
    };

    const fetchTodayTime = async () => {
        try {
            const res = await API.get('/time/today');
            const { total_seconds, login_time, worked_seconds, is_logged_in, current_session_start } = res.data;
            if (login_time) setLoginTime(login_time);
            setCurrentSessionStart(current_session_start || login_time || null);
            setWorkedSecondsBase(worked_seconds || 0);
            setIsLoggedIn(is_logged_in || false);
            setTotalSecondsToday(is_logged_in ? (worked_seconds || 0) : (total_seconds || 0));
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
            const tasksRes = await API.get(`/projects/${projId}/tasks`);
            setTasks(tasksRes.data);

            const annRes = await API.get(`/projects/${projId}/announcements`);
            setAnnouncements(annRes.data);

            const visitRes = await API.get(`/projects/${projId}/site-visits`);
            setSiteVisits(visitRes.data);
        } catch (e) {
            console.error('Failed to load project details:', e);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await API.get('/checklists');
            setChecklistTemplates(res.data);
        } catch (e) {
            console.error('Failed to load templates', e);
        }
    };

    // --- Shift Timer ---
    useEffect(() => {
        if (timerInterval.current) clearInterval(timerInterval.current);

        if (isLoggedIn && currentSessionStart) {
            const getElapsed = () => {
                const sessionMs = Date.now() - new Date(currentSessionStart).getTime();
                const sessionSecs = Math.max(0, Math.floor(sessionMs / 1000));
                return workedSecondsBase + sessionSecs;
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
    }, [isLoggedIn, currentSessionStart, workedSecondsBase]);

    // --- Project Timer ---
    useEffect(() => {
        if (projectTimerInterval.current) clearInterval(projectTimerInterval.current);

        if (activeLog && activeLog.start_time) {
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

    const handleOpenChecklistModal = async (projId) => {
        setChecklistProjId(projId);
        try {
            const res = await API.get(`/projects/${projId}/tasks`);
            setProjectTasks(res.data);
            loadTemplates();
            setShowChecklistModal(true);
        } catch (e) {
            alert('Failed to load project tasks');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            const res = await API.post(`/projects/${checklistProjId}/tasks`, {
                task_name: newCategoryName
            });
            setProjectTasks(res.data);
            setNewCategoryName('');
            loadTemplates();
        } catch (e) {
            alert('Failed to add category');
        }
    };

    const handleCreateSubtask = async (e, categoryId) => {
        e.preventDefault();
        if (!newSubtaskName.trim()) return;
        try {
            const res = await API.post(`/projects/${checklistProjId}/subtasks`, {
                task_id: categoryId,
                subtask_name: newSubtaskName,
                sheet_no: newSubtaskSheetNo
            });
            setProjectTasks(res.data);
            setNewSubtaskName('');
            setNewSubtaskSheetNo('');
            setActiveAddSubtaskCategoryId(null);
            loadTemplates();
        } catch (e) {
            alert('Failed to add subtask');
        }
    };

    const handleSubtaskNameChange = (val, suggestions) => {
        setNewSubtaskName(val);
        const match = suggestions.find(s => s.subtask_name.toLowerCase() === val.toLowerCase());
        if (match) {
            setNewSubtaskSheetNo(match.sheet_no || '');
        }
    };

    const handleToggleSubtaskStatus = async (subtaskId, newStatus, projIdForRefresh) => {
        try {
            await API.put(`/tasks/subtasks/${subtaskId}`, { status: newStatus });
            const res = await API.get(`/projects/${projIdForRefresh}/tasks`);
            if (checklistProjId === projIdForRefresh) {
                setProjectTasks(res.data);
            }
            if (selectedProjectId === projIdForRefresh) {
                setTasks(res.data);
            }
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        if (!window.confirm('Are you sure you want to delete this subtask?')) return;
        try {
            await API.delete(`/tasks/subtasks/${subtaskId}`);
            const res = await API.get(`/projects/${checklistProjId}/tasks`);
            setProjectTasks(res.data);
            if (selectedProjectId === checklistProjId) {
                setTasks(res.data);
            }
        } catch (e) {
            alert('Failed to delete subtask');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category and all its subtasks?')) return;
        try {
            await API.delete(`/tasks/categories/${categoryId}`);
            const res = await API.get(`/projects/${checklistProjId}/tasks`);
            setProjectTasks(res.data);
            if (selectedProjectId === checklistProjId) {
                setTasks(res.data);
            }
        } catch (e) {
            alert('Failed to delete category');
        }
    };

    const handleSaveChecklistAsTemplate = async (e) => {
        e.preventDefault();
        if (!saveTemplateName.trim()) return;
        if (projectTasks.length === 0) {
            alert('No tasks to save as a template.');
            return;
        }
        try {
            const cleanedTasks = projectTasks.map(cat => ({
                task_name: cat.task_name,
                subtasks: (cat.subtasks || []).map(sub => ({
                    subtask_name: sub.subtask_name,
                    sheet_no: sub.sheet_no || ''
                }))
            }));
            await API.post('/checklists', {
                name: saveTemplateName,
                tasks: cleanedTasks
            });
            alert('Checklist template saved successfully!');
            setSaveTemplateName('');
            loadTemplates();
        } catch (err) {
            console.error('Failed to save template:', err?.response?.data || err.message);
            alert('Failed to save template: ' + (err?.response?.data?.message || err.message));
        }
    };

    const handleApplyTemplate = async (e) => {
        e.preventDefault();
        if (!selectedTemplateId) return;
        try {
            const res = await API.post(`/projects/${checklistProjId}/tasks/apply-template`, {
                templateId: selectedTemplateId
            });
            setProjectTasks(res.data);
            setSelectedTemplateId('');
            if (selectedProjectId === checklistProjId) {
                setTasks(res.data);
            }
            alert('Template applied successfully!');
        } catch (e) {
            alert('Failed to apply template');
        }
    };

    const toggleReadReceipts = async (annId) => {
        if (expandedReads[annId]) {
            const next = { ...expandedReads };
            delete next[annId];
            setExpandedReads(next);
        } else {
            try {
                const res = await API.get(`/announcements/${annId}/reads`);
                setExpandedReads({
                    ...expandedReads,
                    [annId]: res.data
                });
            } catch (e) {
                console.error('Failed to fetch read receipts:', e);
            }
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

    const handleOpenAnnouncementModal = async (annId) => {
        try {
            const res = await API.get(`/announcements/${annId}`);
            setViewingAnn(res.data);
            setShowAnnModal(true);

            await API.post(`/announcements/${annId}/read`);

            const readsRes = await API.get(`/announcements/${annId}/reads`);
            setModalReads(readsRes.data);
            setShowModalReads(false);

            if (selectedProjectId) fetchProjectDetails(selectedProjectId);
        } catch (e) {
            console.error('Failed to fetch announcement details:', e);
        }
    };

    const loadAnnouncements = async (projId) => {
        if (!projId) {
            setAnnouncements([]);
            return;
        }
        try {
            const res = await API.get(`/projects/${projId}/announcements`);
            setAnnouncements(res.data);
        } catch (e) {
            console.error('Failed to load announcements', e);
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
            const targetProjId = annProjectId;
            setAnnContent('');
            loadDashboard();
            loadAnnouncements(targetProjId);
        } catch (e) {
            alert('Failed to post announcement');
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
            const formData = new FormData();
            formData.append('visit_date', visitDate);
            formData.append('visit_time', visitTime);
            formData.append('mom', visitMom);
            for (const photo of visitPhotos) {
                formData.append('photos', photo);
            }
            await API.post(`/projects/${selectedProjectId}/site-visits`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setVisitMom('');
            setVisitPhotos([]);
            const fileInput = document.getElementById('visit-photo-input');
            if (fileInput) fileInput.value = '';
            alert('Site visit logged successfully.');
            fetchProjectDetails(selectedProjectId);
        } catch (err) {
            console.error('Failed to log site visit:', err?.response?.data || err.message);
            alert('Failed to log site visit: ' + (err?.response?.data?.message || err.message));
        } finally {
            setVisitLoading(false);
        }
    };

    const handleOpenEditVisit = (visit) => {
        setEditingVisit(visit);
        setEditVisitDate(new Date(visit.visit_date).toISOString().split('T')[0]);
        setEditVisitTime(visit.visit_time.slice(0, 5));
        setEditVisitMom(visit.mom);
        setDeletedPhotos([]);
        setEditPhotos([]);
        setShowVisitModal(true);
    };

    const handleUpdateSiteVisit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('visit_date', editVisitDate);
            formData.append('visit_time', editVisitTime);
            formData.append('mom', editVisitMom);
            formData.append('deleted_photos', JSON.stringify(deletedPhotos));
            for (const file of editPhotos) {
                formData.append('photos', file);
            }

            await API.put(`/site-visits/${editingVisit.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Site visit updated.');
            setShowVisitModal(false);
            setDeletedPhotos([]);
            setEditPhotos([]);
            if (selectedProjectId) {
                fetchProjectDetails(selectedProjectId);
            }
        } catch (e) {
            console.error('Failed to update site visit:', e);
            alert('Failed to update site visit');
        }
    };

    const handleDeleteSiteVisit = async (visitId) => {
        if (!window.confirm('Are you sure you want to delete this site visit log?')) return;
        try {
            await API.delete(`/site-visits/${visitId}`);
            alert('Site visit deleted.');
            if (selectedProjectId) {
                fetchProjectDetails(selectedProjectId);
            }
        } catch (e) {
            console.error('Failed to delete site visit:', e);
            alert('Failed to delete site visit');
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
            loadDashboard();
        } catch (e) {
            alert('Failed to create project');
        }
    };

    // --- Admin-only Staff Handlers ---
    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', empName);
            formData.append('email', empEmail);
            formData.append('phone_number', empPhone);
            formData.append('designation', empDesignation);
            formData.append('password', empPassword);
            formData.append('role', empRole);
            if (empProfileImage) {
                formData.append('profile_image', empProfileImage);
            }

            await API.post('/users', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Employee registered successfully!');
            setEmpName('');
            setEmpEmail('');
            setEmpPhone('');
            setEmpDesignation('');
            setEmpPassword('');
            setEmpRole('Employee');
            setEmpProfileImage(null);
            
            const fileInput = document.getElementById('emp-profile-input');
            if (fileInput) fileInput.value = '';

            loadEmployees();
            loadDashboard();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to register employee');
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
        if (newPass === null) return;
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

    const handleDeleteEmployee = async (id, name) => {
        if (!isAdmin) {
            alert('Only the owner Admin can delete staff accounts.');
            return;
        }
        if (!window.confirm(`Are you sure you want to permanently delete staff member ${name}? This action is permanent and will delete their attendance records, time logs, and site visit entries.`)) {
            return;
        }
        try {
            const res = await API.delete(`/users/${id}`);
            alert(res.data.message || 'Staff member deleted.');
            loadEmployees();
            loadDashboard();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to delete staff member');
        }
    };

    const handleOpenEditModal = (emp) => {
        setEditEmpId(emp.id);
        setEditEmpName(emp.name);
        setEditEmpEmail(emp.email);
        setEditEmpPhone(emp.phone_number || '');
        setEditEmpDesignation(emp.designation || '');
        setEditEmpRole(emp.role);
        setEditEmpProfileImage(null);
        setEditEmpProfileImageUrl(emp.profile_image_url || '');
        setShowEditEmpModal(true);
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editEmpName);
            formData.append('email', editEmpEmail);
            formData.append('phone_number', editEmpPhone);
            formData.append('designation', editEmpDesignation);
            formData.append('role', editEmpRole);
            if (editEmpProfileImage) {
                formData.append('profile_image', editEmpProfileImage);
            }

            await API.put(`/users/${editEmpId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowEditEmpModal(false);
            loadEmployees();
            loadDashboard();
        } catch (err) {
            console.error('Failed to update employee:', err);
            const errMsg = err.response?.data?.message || err.message;
            alert('Failed to update employee: ' + errMsg);
        }
    };

    const handleOpenEditModal = (emp) => {
        setEditEmpId(emp.id);
        setEditEmpName(emp.name);
        setEditEmpEmail(emp.email);
        setEditEmpPhone(emp.phone_number || '');
        setEditEmpDesignation(emp.designation || '');
        setEditEmpRole(emp.role);
        setEditEmpProfileImage(null);
        setEditEmpProfileImageUrl(emp.profile_image_url || '');
        setShowEditEmpModal(true);
    };
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editEmpName);
            formData.append('email', editEmpEmail);
            formData.append('phone_number', editEmpPhone);
            formData.append('designation', editEmpDesignation);
            formData.append('role', editEmpRole);
            if (editEmpProfileImage) {
                formData.append('profile_image', editEmpProfileImage);
            }
            await API.put(`/users/${editEmpId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowEditEmpModal(false);
            loadEmployees();
            loadDashboard();
        } catch (err) {
            console.error('Failed to update employee:', err);
            const errMsg = err.response?.data?.message || err.message;
            alert('Failed to update employee: ' + errMsg);
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

    const handleDownloadReport = async (reportType, employeeId = null, extraParams = {}) => {
        try {
            let params = [];
            if (employeeId) params.push(`employeeId=${employeeId}`);
            if (extraParams.startDate) params.push(`startDate=${extraParams.startDate}`);
            if (extraParams.endDate) params.push(`endDate=${extraParams.endDate}`);
            if (extraParams.projectId) params.push(`projectId=${extraParams.projectId}`);
            
            const urlParams = params.length > 0 ? `?${params.join('&')}` : '';
            const response = await API.get(`/reports/${reportType}${urlParams}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = (reportType === 'site-visits' || reportType === 'attendance' || reportType === 'employees' || reportType === 'projects' || reportType === 'employee-activity') ? 'xlsx' : 'csv';
            
            let filename = `${reportType}_report.${ext}`;
            if (employeeId) {
                filename = `${reportType}_report_emp_${employeeId}.${ext}`;
            } else if (extraParams.projectId) {
                filename = `${reportType}_report_proj_${extraParams.projectId}.${ext}`;
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            alert('Failed to download report');
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand" style={{ marginBottom: '10px' }}>
                    <img src={logoImg} alt="lyve" style={{ width: '130px', display: 'block' }} />
                </div>
                <div style={{ borderBottom: '1px solid var(--border-color)', margin: '10px -24px 20px -24px' }} />

                <nav className="nav-menu">
                    <div className="nav-section-header">Main</div>
                    <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                        <span>Overview</span>
                    </div>

                    <div className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span>Employee master</span>
                    </div>

                    <div className="nav-section-header">Operations</div>
                    <div className={`nav-item ${activeTab === 'site-visits' ? 'active' : ''}`} onClick={() => setActiveTab('site-visits')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>Log Site Visit</span>
                    </div>

                    <div className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        <span>Announcements</span>
                    </div>

                    <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span>Reports</span>
                    </div>

                    <div className="nav-section-header">Tasks</div>
                    <div className="nav-item-static" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px 4px 12px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '700', fontSize: '15.5px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                        <span>My Tasks</span>
                    </div>
                    <div className="sidebar-tasks-card" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px', margin: '4px 0 12px 0' }}>
                        <form onSubmit={handleAddTask} style={{ marginBottom: '10px', display: 'flex', gap: '6px' }}>
                            <input
                                type="text"
                                placeholder="+ Add new task..."
                                required
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: '#FFFFFF',
                                    padding: '6px 10px',
                                    fontSize: '13px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        </form>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
                            {personalTasks.map(t => {
                                const isTicking = tickingTasks.includes(t.id);
                                return (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleTask(t.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                border: isTicking ? '2px solid #FFFFFF' : '2px solid rgba(255, 255, 255, 0.5)',
                                                backgroundColor: isTicking ? '#FFFFFF' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {isTicking && <span style={{ color: '#443F46', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                                            </div>
                                        </button>
                                        
                                        {editingTaskId === t.id ? (
                                            <form onSubmit={(e) => handleSaveEditTask(e, t.id)} style={{ display: 'flex', gap: '4px', flex: 1, alignItems: 'center' }}>
                                                <input 
                                                    type="text"
                                                    value={editingTaskTitle}
                                                    onChange={e => setEditingTaskTitle(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '2px 6px',
                                                        fontSize: '13px',
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        borderRadius: '4px',
                                                        color: '#FFFFFF',
                                                        outline: 'none',
                                                        minWidth: 0
                                                    }}
                                                    autoFocus
                                                    required
                                                />
                                                <button type="submit" style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '12px', padding: '2px' }} title="Save">✓</button>
                                                <button type="button" onClick={() => setEditingTaskId(null)} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', fontSize: '12px', padding: '2px' }} title="Cancel">✕</button>
                                            </form>
                                        ) : (
                                            <>
                                                <span style={{ 
                                                    fontSize: '13px', 
                                                    color: isTicking ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF', 
                                                    textDecoration: isTicking ? 'line-through' : 'none',
                                                    wordBreak: 'break-word',
                                                    fontFamily: 'var(--font-body)',
                                                    fontWeight: '500',
                                                    flex: 1
                                                }}>
                                                    {t.title}
                                                </span>
                                                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', opacity: 0.65 }}>
                                                    <button 
                                                        onClick={() => { setEditingTaskId(t.id); setEditingTaskTitle(t.title); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '11px', color: '#FFFFFF' }}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            {personalTasks.length === 0 && (
                                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic', margin: '4px 0 0 0', textAlign: 'center' }}>
                                    All tasks completed!
                                </p>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="user-profile-widget">
                    <div className="user-profile-header">
                        <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user?.profile_image_url ? (
                                <img 
                                    src={`${getBackendUrl()}${user.profile_image_url}`} 
                                    src={`${getBackendUrl()}${user.profile_image_url}`}
                                    alt={user.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
                            )}
                        </div>
                        <div className="user-details">
                            <span className="user-details-name">{user?.name}</span>
                            <span className="user-details-role">{user?.role === 'Admin' ? 'Owner Admin' : 'Super Admin'}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-signout">
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="main-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        {activeTab === 'overview' ? (
                            <>
                                <h1 style={{ fontSize: '36px', margin: '0' }}>Welcome, {user?.name}</h1>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Log tasks, log visits, and switch projects seamlessly.</p>
                            </>
                        ) : (
                            <h1 style={{ fontSize: '32px', margin: 0, textTransform: 'capitalize' }}>
                                {activeTab === 'site-visits' ? 'Site Visits' : activeTab === 'employees' ? 'Employee master' : activeTab} Management
                            </h1>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {activeTab === 'projects' && (
                            <button onClick={() => setShowProjModal(true)} className="btn btn-primary" style={{ height: 'fit-content' }}>
                                + Add Project
                            </button>
                        )}


                        {/* Today's Ticking Timer */}
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', borderColor: isLoggedIn ? 'var(--accent-secondary)' : 'var(--border-color)' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                    {isLoggedIn ? 'Shift Timer · Active' : 'Shift Timer · Paused'}
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'monospace', color: isLoggedIn ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
                                    {formatTime(totalSecondsToday)}
                                </div>
                            </div>
                            <div className={`status-bulb ${isLoggedIn ? 'online' : 'offline'}`} />
                        </div>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            {/* Active Projects */}
                            <div className="glass-card stat-card info" onClick={() => setActiveTab('projects')} style={{ cursor: 'pointer' }}>
                                <div className="stat-card-header">
                                    <span className="stat-label">Active Projects</span>
                                    <div className="stat-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    </div>
                                </div>
                                <span className="stat-value">{stats.active_projects}</span>
                            </div>

                            {/* Live Active Staff */}
                            <div className="glass-card stat-card success">
                                <div className="stat-card-header">
                                    <span className="stat-label">Live Active Staff</span>
                                    <div className="stat-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </div>
                                </div>
                                <span className="stat-value">{stats.employees_working}</span>
                            </div>

                            {/* Hours Logged Today */}
                            <div className="glass-card stat-card warning">
                                <div className="stat-card-header">
                                    <span className="stat-label">Hours Logged Today</span>
                                    <div className="stat-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                </div>
                                <span className="stat-value">{stats.total_hours_today} hrs</span>
                            </div>

                            {/* Site Visits Today */}
                            <div className="glass-card stat-card success">
                                <div className="stat-card-header">
                                    <span className="stat-label">Site Visits Today</span>
                                    <div className="stat-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                </div>
                                <span className="stat-value">{stats.site_visits_today}</span>
                            </div>

                            {/* Completed Tasks */}
                            <div className="glass-card stat-card info">
                                <div className="stat-card-header">
                                    <span className="stat-label">Completed Tasks</span>
                                    <div className="stat-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                </div>
                                <span className="stat-value">{stats.completed_tasks}</span>
                            </div>
                        </div>

                        {/* Overview Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                            {/* Left Column: Project Switcher, Today's Project Breakdown, Checklist */}
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h3 style={{ margin: 0 }}>Project Checklist</h3>
                                            <button 
                                                type="button" 
                                                onClick={() => handleOpenChecklistModal(selectedProjectId)} 
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Manage Checklist
                                            </button>
                                        </div>
                                        {tasks.length === 0 ? (
                                            <p style={{ color: 'var(--text-secondary)' }}>No checklist tasks set up for this project yet. Use "Manage Checklist" to add drawings/subtasks.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {tasks.map(category => (
                                                    <div key={category.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
                                                        {/* Category Header Bar */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF2F2', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                                            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{category.task_name}</span>
                                                        </div>

                                                        {/* Subtasks List */}
                                                        <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                                                            <table className="custom-table" style={{ margin: 0 }}>
                                                                <thead>
                                                                    <tr style={{ background: '#FAF9F6' }}>
                                                                        <th style={{ width: '45%' }}>Description</th>
                                                                        <th style={{ width: '20%' }}>Sheet No.</th>
                                                                        <th style={{ width: '15%' }}>Date Completed</th>
                                                                        <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {category.subtasks && category.subtasks.map(sub => (
                                                                        <tr key={sub.id}>
                                                                            <td style={{ fontWeight: '500' }}>{sub.subtask_name}</td>
                                                                            <td>
                                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{sub.sheet_no || '--'}</span>
                                                                            </td>
                                                                            <td>
                                                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                                                    {sub.completed_at ? new Date(sub.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '--'}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{ textAlign: 'center' }}>
                                                                                <select 
                                                                                    value={sub.status || 'Pending'} 
                                                                                    onChange={(e) => handleToggleSubtaskStatus(sub.id, e.target.value, selectedProjectId)} 
                                                                                    className={`status-select ${
                                                                                        (sub.status || 'Pending') === 'Completed' ? 'completed' : 
                                                                                        (sub.status || 'Pending') === 'In Progress' ? 'in-progress' : 'pending'
                                                                                    }`}
                                                                                >
                                                                                    <option value="Pending">Pending</option>
                                                                                    <option value="In Progress">In Progress</option>
                                                                                    <option value="Completed">Completed</option>
                                                                                </select>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {(!category.subtasks || category.subtasks.length === 0) && (
                                                                        <tr>
                                                                            <td colSpan="4" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                                                                                No subtasks defined in this category.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                )}
                            </div>

                            {/* Right Column: Announcements, Compact Logs */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Announcements Feed */}
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
                                                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '8px' }}>
                                                        {ann.content}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReadReceipts(ann.id);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--accent-color)',
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            {expandedReads[ann.id] ? 'Hide Read Receipts' : 'View Read Receipts'}
                                                        </button>
                                                    </div>

                                                    {expandedReads[ann.id] && (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                marginTop: '10px',
                                                                padding: '10px',
                                                                background: 'var(--bg-secondary)',
                                                                border: '1px solid var(--border-color)',
                                                                borderRadius: '8px',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                                                                Read Receipts ({expandedReads[ann.id].length})
                                                            </strong>
                                                            {expandedReads[ann.id].length === 0 ? (
                                                                <span style={{ color: 'var(--text-muted)' }}>No one has read this announcement yet.</span>
                                                            ) : (
                                                                <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                                                                    {expandedReads[ann.id].map((r, i) => (
                                                                        <li key={i} style={{ marginBottom: '4px' }}>
                                                                            <strong>{r.employee_name}</strong> at {new Date(r.read_at).toLocaleString()}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Recent Activity Logs */}
                                <section className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginBottom: '20px' }}>Recent Activity Logs</h3>
                                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
                                        {notifications.map(n => (
                                            <div key={n.id} className="notification-item" style={{ padding: '8px 12px' }}>
                                                <div className="notification-icon" style={{ display: 'flex', alignItems: 'center' }}>
                                                    {n.type === 'login' ? (
                                                        <span className="log-bullet online" style={{ width: '10px', height: '10px' }} />
                                                    ) : n.type === 'logout' ? (
                                                        <span className="log-bullet offline" style={{ width: '10px', height: '10px' }} />
                                                    ) : (
                                                        '📢'
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '13.5px' }}>
                                                    <div>
                                                        {n.message}
                                                        {n.type === 'announcement' && n.related_id && (
                                                            <span 
                                                                onClick={() => handleOpenAnnouncementModal(n.related_id)} 
                                                                style={{ 
                                                                    color: 'var(--accent-color)', 
                                                                    cursor: 'pointer', 
                                                                    textDecoration: 'underline', 
                                                                    marginLeft: '6px', 
                                                                    fontSize: '11px',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="notification-time" style={{ fontSize: '12px' }}>{new Date(n.created_at).toLocaleTimeString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && (
                                            <p style={{ padding: '16px', color: 'var(--text-secondary)' }}>No recent activity logged.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </>
                )}

                {/* EMPLOYEE MASTER TAB */}
                {activeTab === 'employees' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                        {showEmpTabAttOptions && (
                            <div 
                                className="glass-card" 
                                style={{ 
                                    padding: '24px', 
                                    borderColor: 'var(--accent-secondary)', 
                                    borderRadius: '16px',
                                    textAlign: 'left',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>📅</span>
                                        <h3 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '20px', fontWeight: '600' }}>
                                            Export Attendance Log
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowEmpTabAttOptions(false)} 
                                        className="btn btn-secondary btn-sm"
                                        style={{ 
                                            padding: '8px 16px', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--border-color)', 
                                            background: '#FFFFFF',
                                            color: 'var(--text-primary)',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                            Start Date
                                        </label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            style={{ fontSize: '14px', padding: '10px 14px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            value={attStartDate} 
                                            onChange={e => setAttStartDate(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                            End Date
                                        </label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            style={{ fontSize: '14px', padding: '10px 14px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            value={attEndDate} 
                                            onChange={e => setAttEndDate(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                                        Staff Filter
                                    </label>
                                    <select 
                                        className="form-control" 
                                        style={{ fontSize: '14px', padding: '10px 14px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        value={attEmployeeId} 
                                        onChange={e => setAttEmployeeId(e.target.value)}
                                    >
                                        <option value="">All Employees (Multi-sheet Excel)</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} (ID: {emp.id})</option>
                                        ))}
                                    </select>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        fontSize: '15px', 
                                        fontWeight: '600', 
                                        backgroundColor: 'var(--accent-primary)',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        handleDownloadReport('attendance', attEmployeeId || null, { startDate: attStartDate, endDate: attEndDate });
                                    }}
                                >
                                    Generate & Download Report
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* List */}
                            <section className="glass-card" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}>Staff Accounts</h3>
                                    <button 
                                        onClick={() => setShowEmpTabAttOptions(true)} 
                                        className="btn btn-secondary btn-sm"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span>📅</span> Export Attendance Log
                                    </button>
                                </div>
                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Role</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map(emp => (
                                                <tr key={emp.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {emp.profile_image_url ? (
                                                                <img 
                                                                    src={`${getBackendUrl()}${emp.profile_image_url}`} 
                                                                    src={`${getBackendUrl()}${emp.profile_image_url}`}
                                                                    alt={emp.name} 
                                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--stone-line)' }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                                                    {emp.name ? emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.designation} &bull; {emp.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${emp.role === 'Admin' ? 'danger' : emp.role === 'Secondary Admin' ? 'warning' : 'info'}`}>
                                                            {emp.role === 'Admin' ? 'Owner Admin' : emp.role === 'Secondary Admin' ? 'Super Admin' : 'Employee'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {emp.role !== 'Admin' && (
                                                                <button onClick={() => handleOpenEditModal(emp)} className="btn btn-secondary btn-sm">
                                                                    Edit
                                                                </button>
                                                            )}
                                                            {emp.role !== 'Admin' && (
                                                                <button onClick={() => handleOpenEditModal(emp)} className="btn btn-secondary btn-sm">
                                                                    Edit
                                                                </button>
                                                            )}
                                                            {emp.role !== 'Admin' && isAdmin && (
                                                                <button onClick={() => handleToggleEmpRole(emp.id, emp.role)} className="btn btn-secondary btn-sm">
                                                                    {emp.role === 'Secondary Admin' ? 'Demote' : 'Promote'}
                                                                </button>
                                                            )}
                                                            {isAdmin && (
                                                                <button onClick={() => handleResetPassword(emp.id)} className="btn btn-secondary btn-sm">
                                                                    Reset
                                                                </button>
                                                            )}
                                                            {emp.role !== 'Admin' && isAdmin && (
                                                                <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="btn btn-danger btn-sm">
                                                                    Delete
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
                            <section className="glass-card" style={{ height: 'fit-content', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
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
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <input 
                                                type={showEmpPassword ? "text" : "password"} 
                                                required 
                                                className="form-input"
                                                value={empPassword}
                                                onChange={e => setEmpPassword(e.target.value)}
                                                style={{ paddingRight: '40px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowEmpPassword(!showEmpPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '4px'
                                                }}
                                                title={showEmpPassword ? "Hide password" : "Show password"}
                                            >
                                                {showEmpPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
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
                                    <div className="form-group" style={{ marginBottom: '24px' }}>
                                        <label className="form-label">Profile Image (optional)</label>
                                        <input 
                                            id="emp-profile-input"
                                            type="file" 
                                            accept="image/*"
                                            className="form-input"
                                            style={{ padding: '8px 12px', cursor: 'pointer' }}
                                            onChange={e => setEmpProfileImage(e.target.files[0])}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                        Register Employee
                                    </button>
                                </form>
                            </section>
                        </div>
                    </div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                    <section className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                            <h3 style={{ margin: 0 }}>Project Overview</h3>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Search project..." 
                                value={projectSearch} 
                                onChange={e => setProjectSearch(e.target.value)}
                                style={{ width: '250px', padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="project-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                            {projects
                                .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                             (p.location && p.location.toLowerCase().includes(projectSearch.toLowerCase())) || 
                                             (p.site_engineer_contact && p.site_engineer_contact.toLowerCase().includes(projectSearch.toLowerCase())))
                                .map(proj => (
                                    <div key={proj.id} className="glass-card project-overview-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                                        {/* Header: Name & Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{proj.name}</h4>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {proj.site_engineer_contact || 'No Contact'} &bull; {proj.location || 'No Location'}
                                                </div>
                                            </div>
                                            {/* Status selector */}
                                            <select 
                                                className="form-select"
                                                value={proj.status}
                                                onChange={e => handleUpdateProjectStatus(proj.id, e.target.value)}
                                                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="On Hold">On Hold</option>
                                                <option value="Closed">Closed</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>

                                        {/* Boxes Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Hours Used</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{Math.round(proj.total_hours || 0)}h</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Team Members</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{proj.assigned_team?.length || 0}</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Progress</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-secondary, #06b6d4)', marginTop: '4px' }}>{proj.progress_percentage}%</div>
                                            </div>
                                        </div>

                                        {/* Footer: Team member pills & Tasks Checklist button */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
                                            {/* Team member pills */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {proj.assigned_team && proj.assigned_team.map((name, idx) => (
                                                    <span key={idx} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                                                        {name}
                                                    </span>
                                                ))}
                                                {(!proj.assigned_team || proj.assigned_team.length === 0) && (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No active team logged</span>
                                                )}
                                            </div>

                                            {/* Tasks Checklist Button */}
                                            <button onClick={() => handleOpenChecklistModal(proj.id)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                Tasks Checklist
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        {projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                             (p.location && p.location.toLowerCase().includes(projectSearch.toLowerCase())) || 
                                             (p.site_engineer_contact && p.site_engineer_contact.toLowerCase().includes(projectSearch.toLowerCase()))).length === 0 && (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No projects match your search.
                            </div>
                        )}
                    </section>
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
                                <form onSubmit={handleLogSiteVisit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
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
                                            <textarea
                                                className="form-input"
                                                placeholder={"Write observations...\n• Point 1\n• Point 2"}
                                                rows={4}
                                                value={visitMom}
                                                onChange={e => setVisitMom(e.target.value)}
                                                style={{ resize: 'vertical', minHeight: '90px', lineHeight: '1.5' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'end', gap: '16px' }}>
                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label className="form-label">Site Photos (optional, up to 10)</label>
                                            <input 
                                                id="visit-photo-input"
                                                type="file" 
                                                multiple 
                                                accept="image/*"
                                                className="form-input"
                                                style={{ padding: '8px 12px', cursor: 'pointer' }}
                                                onChange={e => setVisitPhotos(Array.from(e.target.files))}
                                            />
                                            {visitPhotos.length > 0 && (
                                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {visitPhotos.map((f, idx) => (
                                                        <span key={idx} style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                            📷 {f.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className="btn btn-primary" disabled={visitLoading} style={{ whiteSpace: 'nowrap' }}>
                                            {visitLoading ? 'Logging...' : 'Submit Visit'}
                                        </button>
                                    </div>
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
                                                    <th>Photos</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {siteVisits.map(v => {
                                                    let photos = [];
                                                    try { photos = v.photo_url ? (Array.isArray(v.photo_url) ? v.photo_url : JSON.parse(v.photo_url)) : []; } catch(_) {}
                                                    return (
                                                        <tr key={v.id}>
                                                            <td>{new Date(v.visit_date).toISOString().split('T')[0]}</td>
                                                            <td>{v.visit_time.slice(0, 5)}</td>
                                                            <td>{v.employee_name}</td>
                                                            <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{v.mom}</td>
                                                            <td>
                                                                {photos.length === 0 ? (
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                                                ) : (
                                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                        {photos.map((url, i) => (
                                                                            <img 
                                                                                key={i}
                                                                                src={`${getBackendUrl()}${url}`} 
                                                                                src={`${getBackendUrl()}${url}`} 
                                                                                alt={`site visit photo ${i+1}`}
                                                                                onClick={() => setPreviewPhoto(`${getBackendUrl()}${url}`)}
                                                                                onClick={() => setPreviewPhoto(`${getBackendUrl()}${url}`)}
                                                                                style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {(v.employee_id === user?.id || user?.role === 'Admin') && (
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button 
                                                                            onClick={() => handleOpenEditVisit(v)} 
                                                                            className="btn btn-secondary btn-sm"
                                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteSiteVisit(v.id)} 
                                                                            className="btn btn-danger btn-sm"
                                                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
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
                                    onChange={e => {
                                        const val = e.target.value;
                                        setAnnProjectId(val);
                                        loadAnnouncements(val);
                                    }}
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

                        {annProjectId && (
                            <div style={{ marginTop: '30px', textAlign: 'left' }}>
                                <h4 style={{ marginBottom: '16px' }}>Past Announcements for this Project</h4>
                                {announcements.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No announcements posted yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {announcements.map(ann => (
                                            <div 
                                                key={ann.id} 
                                                style={{
                                                    padding: '16px',
                                                    background: 'var(--bg-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '12px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                                    Posted by <strong>{ann.author_name}</strong> &bull; {new Date(ann.created_at).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '10px' }}>
                                                    {ann.content}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleReadReceipts(ann.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--accent-color)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            textDecoration: 'underline'
                                                        }}
                                                    >
                                                        {expandedReads[ann.id] ? 'Hide Read Receipts' : 'View Read Receipts'}
                                                    </button>
                                                </div>

                                                {expandedReads[ann.id] && (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        padding: '10px',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}>
                                                        <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                                                            Read Receipts ({expandedReads[ann.id].length})
                                                        </strong>
                                                        {expandedReads[ann.id].length === 0 ? (
                                                            <span style={{ color: 'var(--text-muted)' }}>No one has read this announcement yet.</span>
                                                        ) : (
                                                            <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                                                                {expandedReads[ann.id].map((r, i) => (
                                                                    <li key={i} style={{ marginBottom: '4px' }}>
                                                                        <strong>{r.employee_name}</strong> at {new Date(r.read_at).toLocaleString()}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <section className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '12px' }}>Operational Excel/CSV Exports</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                            Generate and download real-time, tab-separated CSV/Excel logs ready for audit, accounting, and presentation.
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
                            
                            {showAttOptions ? (
                                <div 
                                    className="glass-card" 
                                    style={{ padding: '24px', gridColumn: 'span 2', borderColor: 'var(--accent-secondary)', textAlign: 'left' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📅</span> Export Attendance Log
                                        </h4>
                                        <button 
                                            onClick={() => setShowAttOptions(false)} 
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Start Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                style={{ fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                value={attStartDate} 
                                                onChange={e => setAttStartDate(e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>End Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                style={{ fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                value={attEndDate} 
                                                onChange={e => setAttEndDate(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Staff Filter</label>
                                        <select 
                                            className="form-control" 
                                            style={{ fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            value={attEmployeeId} 
                                            onChange={e => setAttEmployeeId(e.target.value)}
                                        >
                                            <option value="">All Employees (Multi-sheet Excel)</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} (ID: {emp.id})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                                        onClick={() => {
                                            handleDownloadReport('attendance', attEmployeeId || null, { startDate: attStartDate, endDate: attEndDate });
                                        }}
                                    >
                                        Generate & Download Report
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setShowAttOptions(true)}
                                    className="glass-card" 
                                    style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)', transition: 'var(--transition-normal)' }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                                    <h4>Attendance Log</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Login/Logout punch-cards, daily totals, statuses.</p>
                                </div>
                            )}

                            {showSvOptions ? (
                                <div 
                                    className="glass-card" 
                                    style={{ padding: '24px', gridColumn: 'span 2', borderColor: 'var(--accent-secondary)', textAlign: 'left' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>🚜</span> Export Site Observation Log
                                        </h4>
                                        <button 
                                            onClick={() => setShowSvOptions(false)} 
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Project Filter</label>
                                        <select 
                                            className="form-control" 
                                            style={{ fontSize: '13px', padding: '8px 12px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                            value={svProjectId} 
                                            onChange={e => setSvProjectId(e.target.value)}
                                        >
                                            <option value="">All Projects</option>
                                            {projects.map(proj => (
                                                <option key={proj.id} value={proj.id}>{proj.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Start Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                style={{ fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                value={svStartDate} 
                                                onChange={e => setSvStartDate(e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>End Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                style={{ fontSize: '13px', padding: '8px 12px', width: '100%', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                value={svEndDate} 
                                                onChange={e => setSvEndDate(e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                                        onClick={() => {
                                            handleDownloadReport('site-visits', null, { projectId: svProjectId, startDate: svStartDate, endDate: svEndDate });
                                        }}
                                    >
                                        Generate & Download Report
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setShowSvOptions(true)}
                                    className="glass-card" 
                                    style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)', transition: 'var(--transition-normal)' }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚜</div>
                                    <h4>Site Observation Log</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Visit dates, times, inspector details, minutes of meetings, and image attachment links.</p>
                                </div>
                            )}

                            <div 
                                onClick={() => handleDownloadReport('employee-activity')}
                                className="glass-card" 
                                style={{ padding: '24px', cursor: 'pointer', borderColor: 'var(--border-color)', gridColumn: 'span 2', transition: 'var(--transition-normal)' }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                                <h4>Staff Activity Register</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Detailed register showing when each employee last worked on each project and total hours spent.</p>
                            </div>
                        </div>
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

                {/* Manage Checklist Modal */}
                {showChecklistModal && (() => {
                    const suggestedTasksTemplate = checklistTemplates.find(t => t.name === 'Suggested Tasks');
                    const suggestedTasksList = suggestedTasksTemplate ? suggestedTasksTemplate.tasks : [];

                    const suggestedSubtasksTemplate = checklistTemplates.find(t => t.name === 'Suggested Subtasks');
                    const suggestedSubtasksList = suggestedSubtasksTemplate ? suggestedSubtasksTemplate.tasks : [];

                    return (
                        <div className="modal-overlay">
                            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-heading)' }}>Project Drawing Checklist</h3>
                                    <button onClick={() => { setShowChecklistModal(false); fetchProjects(); loadDashboard(); }} className="btn btn-secondary btn-sm">Close</button>
                                </div>

                                <div style={{ maxHeight: '380px', overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
                                    {projectTasks.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' }}>No drawing checklists configured. Start by adding a drawing category header below.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {projectTasks.map(category => (
                                                <div key={category.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF' }}>
                                                    {/* Category Header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF2F2', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{category.task_name}</span>
                                                        <button 
                                                            onClick={() => handleDeleteCategory(category.id)} 
                                                            className="btn-link" 
                                                            style={{ color: 'var(--color-danger)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                        >
                                                            Remove Category
                                                        </button>
                                                    </div>

                                                    {/* Subtasks table */}
                                                    <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                                                        <table className="custom-table" style={{ margin: 0 }}>
                                                            <thead>
                                                                <tr style={{ background: '#FAF9F6' }}>
                                                                    <th style={{ width: '40%' }}>Description</th>
                                                                    <th style={{ width: '20%' }}>Sheet No.</th>
                                                                    <th style={{ width: '15%' }}>Date Completed</th>
                                                                    <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
                                                                    <th style={{ width: '5%', textAlign: 'center' }}>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {category.subtasks && category.subtasks.map(sub => (
                                                                    <tr key={sub.id}>
                                                                        <td style={{ fontWeight: '500' }}>{sub.subtask_name}</td>
                                                                        <td>
                                                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{sub.sheet_no || '--'}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                                                {sub.completed_at ? new Date(sub.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '--'}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <select 
                                                                                value={sub.status || 'Pending'} 
                                                                                onChange={(e) => handleToggleSubtaskStatus(sub.id, e.target.value, checklistProjId)} 
                                                                                className={`status-select ${
                                                                                    (sub.status || 'Pending') === 'Completed' ? 'completed' : 
                                                                                    (sub.status || 'Pending') === 'In Progress' ? 'in-progress' : 'pending'
                                                                                }`}
                                                                            >
                                                                                <option value="Pending">Pending</option>
                                                                                <option value="In Progress">In Progress</option>
                                                                                <option value="Completed">Completed</option>
                                                                            </select>
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <button 
                                                                                onClick={() => handleDeleteSubtask(sub.id)}
                                                                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* Add subtask */}
                                                                {activeAddSubtaskCategoryId === category.id ? (
                                                                    <tr style={{ background: 'var(--bg-primary)' }}>
                                                                        <td colSpan="5" style={{ padding: '12px 16px' }}>
                                                                            <form 
                                                                                onSubmit={(e) => handleCreateSubtask(e, category.id)}
                                                                                style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                                                                            >
                                                                                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                    <select 
                                                                                        className="form-select"
                                                                                        style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid var(--border-color)' }}
                                                                                        onChange={e => {
                                                                                            const val = e.target.value;
                                                                                            if (val) {
                                                                                                handleSubtaskNameChange(val, suggestedSubtasksList);
                                                                                            } else {
                                                                                                setNewSubtaskName('');
                                                                                                setNewSubtaskSheetNo('');
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <option value="">-- Choose Subtask Template --</option>
                                                                                        {suggestedSubtasksList.map((item, idx) => (
                                                                                            <option key={idx} value={item.subtask_name}>
                                                                                                {item.subtask_name} {item.sheet_no ? `(${item.sheet_no})` : ''}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <input 
                                                                                        type="text"
                                                                                        required
                                                                                        className="form-input"
                                                                                        placeholder="Or type custom Subtask Name..."
                                                                                        style={{ padding: '6px 12px', fontSize: '13px' }}
                                                                                        value={newSubtaskName}
                                                                                        onChange={e => handleSubtaskNameChange(e.target.value, suggestedSubtasksList)}
                                                                                    />
                                                                                </div>
                                                                                <div style={{ flex: 1 }}>
                                                                                    <input 
                                                                                        type="text"
                                                                                        className="form-input"
                                                                                        placeholder="Sheet No. (e.g. AR-01)..."
                                                                                        style={{ padding: '6px 12px', fontSize: '13px' }}
                                                                                        value={newSubtaskSheetNo}
                                                                                        onChange={e => setNewSubtaskSheetNo(e.target.value)}
                                                                                    />
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 16px' }}>Save Item</button>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        onClick={() => { setActiveAddSubtaskCategoryId(null); setNewSubtaskName(''); setNewSubtaskSheetNo(''); }} 
                                                                                        className="btn btn-secondary btn-sm"
                                                                                        style={{ padding: '6px 12px' }}
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </form>
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="5" style={{ padding: '10px 16px', background: 'var(--bg-primary)' }}>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => { setActiveAddSubtaskCategoryId(category.id); setNewSubtaskName(''); setNewSubtaskSheetNo(''); }} 
                                                                                className="btn btn-secondary btn-sm"
                                                                                style={{ width: '100%', background: 'none', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                                                                            >
                                                                                + Add drawing/subtask checklist item
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

                                {/* Add Category Form */}
                                <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <label className="form-label" style={{ fontWeight: '600', marginBottom: 0 }}>Add Category Header</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <select 
                                            className="form-select"
                                            style={{ flex: 1, padding: '8px 12px' }}
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                        >
                                            <option value="">-- Choose Category Template --</option>
                                            {suggestedTasksList.map((taskName, idx) => (
                                                <option key={idx} value={taskName}>{taskName}</option>
                                            ))}
                                        </select>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>or</span>
                                        <input 
                                            type="text" 
                                            required 
                                            className="form-input" 
                                            placeholder="Type custom Category Header..."
                                            style={{ flex: 1.5 }}
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Create Category</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    );
                })()}

                {/* Edit Site Visit Modal */}
                {showVisitModal && editingVisit && (() => {
                    let currentPhotos = [];
                    try {
                        currentPhotos = editingVisit.photo_url 
                            ? (Array.isArray(editingVisit.photo_url) 
                                ? editingVisit.photo_url 
                                : JSON.parse(editingVisit.photo_url)) 
                            : [];
                    } catch (_) {}

                    return (
                        <div className="modal-overlay">
                            <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
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
                                    <div className="form-group">
                                        <label className="form-label">Observations / MOM</label>
                                        <textarea 
                                            required 
                                            rows="3"
                                            className="form-textarea"
                                            value={editVisitMom}
                                            onChange={e => setEditVisitMom(e.target.value)}
                                        />
                                    </div>

                                    {/* Existing Photos */}
                                    <div className="form-group">
                                        <label className="form-label">Existing Photos</label>
                                        {currentPhotos.length === 0 ? (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No photos uploaded for this site visit.</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                                {currentPhotos.map((url, idx) => {
                                                    const isDeleted = deletedPhotos.includes(url);
                                                    return (
                                                        <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                            <img 
                                                                src={`${getBackendUrl()}${url}`} 
                                                                src={`${getBackendUrl()}${url}`}
                                                                alt="Site Visit" 
                                                                style={{ 
                                                                    width: '100%', 
                                                                    height: '100%', 
                                                                    objectFit: 'cover', 
                                                                    borderRadius: '6px',
                                                                    border: '1px solid var(--border-color)',
                                                                    opacity: isDeleted ? 0.3 : 1
                                                                }}
                                                            />
                                                            {!isDeleted ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletedPhotos([...deletedPhotos, url])}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '-4px',
                                                                        right: '-4px',
                                                                        background: '#e05252',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        fontSize: '11px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    ✕
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletedPhotos(deletedPhotos.filter(p => p !== url))}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '-4px',
                                                                        right: '-4px',
                                                                        background: '#4caf50',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        fontSize: '11px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    ⟲
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload new photos */}
                                    <div className="form-group" style={{ marginBottom: '24px' }}>
                                        <label className="form-label">Add New Photos</label>
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            className="form-input"
                                            onChange={e => setEditPhotos(Array.from(e.target.files))}
                                        />
                                        {editPhotos.length > 0 && (
                                            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {editPhotos.length} new photo(s) selected
                                            </div>
                                        )}
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
                    );
                })()}

                {/* EDIT EMPLOYEE MODAL */}
                {showEditEmpModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: '20px' }}>Edit Staff Member</h3>
                            <form onSubmit={handleUpdateEmployee}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input"
                                        value={editEmpName}
                                        onChange={e => setEditEmpName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        className="form-input"
                                        value={editEmpEmail}
                                        onChange={e => setEditEmpEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={editEmpPhone}
                                        onChange={e => setEditEmpPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={editEmpDesignation}
                                        onChange={e => setEditEmpDesignation(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select 
                                        className="form-input"
                                        value={editEmpRole}
                                        disabled={editEmpRole === 'Admin'} // Owner Admins cannot have their role changed here
                                        onChange={e => setEditEmpRole(e.target.value)}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Secondary Admin">Super Admin</option>
                                        <option value="Admin" disabled>Owner Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Profile Image (Optional)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="form-input"
                                        onChange={e => setEditEmpProfileImage(e.target.files[0])}
                                    />
                                    {editEmpProfileImageUrl && (
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Profile Image:</span>
                                            <br />
                                            <img 
                                                src={editEmpProfileImageUrl.startsWith('/uploads') ? `${getBackendUrl()}${editEmpProfileImageUrl}` : editEmpProfileImageUrl} 
                                                alt="Profile Preview" 
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginTop: '5px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditEmpModal(false)} className="btn btn-secondary">
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

                {/* EDIT EMPLOYEE MODAL */}
                {showEditEmpModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: '20px' }}>Edit Staff Member</h3>
                            <form onSubmit={handleUpdateEmployee}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="form-input"
                                        value={editEmpName}
                                        onChange={e => setEditEmpName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        className="form-input"
                                        value={editEmpEmail}
                                        onChange={e => setEditEmpEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={editEmpPhone}
                                        onChange={e => setEditEmpPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={editEmpDesignation}
                                        onChange={e => setEditEmpDesignation(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select 
                                        className="form-input"
                                        value={editEmpRole}
                                        disabled={editEmpRole === 'Admin'} // Owner Admins cannot have their role changed here
                                        onChange={e => setEditEmpRole(e.target.value)}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Secondary Admin">Super Admin</option>
                                        <option value="Admin" disabled>Owner Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Profile Image (Optional)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="form-input"
                                        onChange={e => setEditEmpProfileImage(e.target.files[0])}
                                    />
                                    {editEmpProfileImageUrl && (
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Profile Image:</span>
                                            <br />
                                            <img 
                                                src={editEmpProfileImageUrl.startsWith('/uploads') ? `${getBackendUrl()}${editEmpProfileImageUrl}` : editEmpProfileImageUrl} 
                                                alt="Profile Preview" 
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginTop: '5px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditEmpModal(false)} className="btn btn-secondary">
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
                {/* Announcement modal */}
                {showAnnModal && viewingAnn && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px', width: '90%', position: 'relative' }}>
                            <button 
                                onClick={() => { setShowAnnModal(false); setViewingAnn(null); }} 
                                style={{ 
                                    position: 'absolute', 
                                    top: '16px', 
                                    right: '16px', 
                                    background: 'none', 
                                    border: 'none', 
                                    fontSize: '18px', 
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                ✕
                            </button>
                            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Project Announcement</h3>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                Project: <strong>{viewingAnn.project_name}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Posted by <strong>{viewingAnn.author_name}</strong> &bull; {new Date(viewingAnn.created_at).toLocaleString()}
                            </div>
                            <div style={{ 
                                fontSize: '14.5px', 
                                color: 'var(--text-primary)', 
                                lineHeight: '1.5', 
                                background: 'var(--bg-secondary)', 
                                padding: '16px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {viewingAnn.content}
                            </div>

                            {/* Read Receipts */}
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModalReads(!showModalReads)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-color)',
                                        fontSize: '12.5px',
                                        cursor: 'pointer',
                                        padding: 0,
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {showModalReads ? 'Hide Read Receipts' : `View Read Receipts (${modalReads.length})`}
                                </button>
                                
                                {showModalReads && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        maxHeight: '150px',
                                        overflowY: 'auto'
                                    }}>
                                        {modalReads.length === 0 ? (
                                            <span style={{ color: 'var(--text-muted)' }}>No one has read this announcement yet.</span>
                                        ) : (
                                            <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                                                {modalReads.map((r, i) => (
                                                    <li key={i} style={{ marginBottom: '4px' }}>
                                                        <strong>{r.employee_name}</strong> at {new Date(r.read_at).toLocaleString()}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Preview Modal */}
                {previewPhoto && (
                    <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
                        <div className="modal-content" style={{ maxWidth: '800px', padding: '16px', background: 'transparent', boxShadow: 'none', border: 'none', position: 'relative' }} onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => setPreviewPhoto(null)} 
                                style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10 }}
                            >
                                ✕
                            </button>
                            <img 
                                src={previewPhoto} 
                                alt="Site Visit Preview" 
                                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', border: '4px solid var(--border-color)', background: 'var(--bg-secondary)' }} 
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
