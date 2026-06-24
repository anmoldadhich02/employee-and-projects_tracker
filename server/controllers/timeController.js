const pool = require('../config/db');

const getLocalDateString = (d = new Date()) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
};


// @desc    Switch to working on a project. Stops previous project timer if any, starts new one.
// @route   POST /api/time/switch
// @access  Protected (Employee)
const switchProject = async (req, res) => {
    const { projectId } = req.body;
    
    if (!projectId) {
        return res.status(400).json({ message: 'projectId is required' });
    }

    try {
        await pool.query('BEGIN');
        
        // Stop any currently active project timer for this employee
        const activeLog = await pool.query(
            'SELECT * FROM time_logs WHERE employee_id = $1 AND end_time IS NULL',
            [req.user.id]
        );

        if (activeLog.rows.length > 0) {
            const oldLog = activeLog.rows[0];
            // If already on the same project, just return the existing log
            if (oldLog.project_id === parseInt(projectId)) {
                await pool.query('COMMIT');
                return res.json({ message: 'Already working on this project', log: oldLog });
            }
            const startTime = new Date(oldLog.start_time);
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / 60000);
            await pool.query(
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                [endTime, durationMinutes, oldLog.id]
            );
        }

        // Start new project timer
        const newLog = await pool.query(
            'INSERT INTO time_logs (employee_id, project_id, start_time) VALUES ($1, $2, NOW()) RETURNING *',
            [req.user.id, projectId]
        );
        
        // Get the project name for the response
        const project = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
        
        await pool.query('COMMIT');
        
        res.status(201).json({
            ...newLog.rows[0],
            project_name: project.rows.length > 0 ? project.rows[0].name : null
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Stop working on current project (go idle, shift timer continues)
// @route   POST /api/time/stop-project
// @access  Protected
const stopProjectTimer = async (req, res) => {
    try {
        const activeLog = await pool.query(
            'SELECT * FROM time_logs WHERE employee_id = $1 AND end_time IS NULL',
            [req.user.id]
        );

        if (activeLog.rows.length > 0) {
            const oldLog = activeLog.rows[0];
            const startTime = new Date(oldLog.start_time);
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / 60000);

            await pool.query(
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                [endTime, durationMinutes, oldLog.id]
            );
            return res.json({ message: 'Project timer stopped', durationMinutes });
        }
        res.json({ message: 'No active project timer found' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get the currently active project timer for the logged-in employee
// @route   GET /api/time/active
// @access  Protected
const getActiveProjectTimer = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tl.*, p.name AS project_name 
             FROM time_logs tl 
             LEFT JOIN projects p ON tl.project_id = p.id 
             WHERE tl.employee_id = $1 AND tl.end_time IS NULL 
             LIMIT 1`,
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.json(null);
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get total shift seconds today for the logged-in employee (from attendance)
// @route   GET /api/time/today
// @access  Protected
const getTodayShiftSeconds = async (req, res) => {
    try {
        const today = getLocalDateString();
        const result = await pool.query(
            `SELECT login_time, logout_time, worked_seconds, current_session_start FROM attendance 
             WHERE employee_id = $1 AND date = $2`,
            [req.user.id, today]
        );
        if (result.rows.length === 0) {
            return res.json({ total_seconds: 0, login_time: null, worked_seconds: 0, is_logged_in: false });
        }
        const row = result.rows[0];
        const isLoggedIn = row.logout_time === null;
        
        let totalSeconds = row.worked_seconds || 0;
        if (isLoggedIn) {
            const sessionStartVal = row.current_session_start || row.login_time;
            totalSeconds += Math.round((new Date() - new Date(sessionStartVal)) / 1000);
        }
        
        res.json({
            total_seconds: totalSeconds,
            login_time: row.login_time,
            worked_seconds: row.worked_seconds || 0,
            is_logged_in: isLoggedIn,
            current_session_start: row.current_session_start || row.login_time
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get breakdown of time spent per project today for the logged-in employee
// @route   GET /api/time/my-projects-today
// @access  Protected
const getMyProjectsToday = async (req, res) => {
    try {
        const today = getLocalDateString();
        const result = await pool.query(
            `SELECT tl.project_id, p.name AS project_name,
                    SUM(
                        CASE 
                            WHEN tl.end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - tl.start_time)) / 60
                            ELSE tl.duration_minutes 
                        END
                    ) AS total_minutes
             FROM time_logs tl
             JOIN projects p ON tl.project_id = p.id
             WHERE tl.employee_id = $1 AND (tl.start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = $2
             GROUP BY tl.project_id, p.name
             ORDER BY total_minutes DESC`,
            [req.user.id, today]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get total hours spent on a project across ALL days and ALL employees
// @route   GET /api/time/project/:projectId/total
// @access  Protected
const getProjectTotalHours = async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            `SELECT COALESCE(SUM(
                CASE 
                    WHEN end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
                    ELSE duration_minutes 
                END
            ), 0) AS total_minutes
             FROM time_logs WHERE project_id = $1`,
            [projectId]
        );
        const totalMinutes = parseFloat(result.rows[0].total_minutes);
        res.json({ 
            project_id: parseInt(projectId),
            total_hours: parseFloat((totalMinutes / 60).toFixed(2)),
            total_minutes: Math.round(totalMinutes)
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get daily breakdown of hours on a project (Day 1, Day 2, etc.)
// @route   GET /api/time/project/:projectId/daily
// @access  Protected
const getProjectDailyBreakdown = async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            `SELECT start_time::date AS work_date,
                    SUM(
                        CASE 
                            WHEN end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
                            ELSE duration_minutes 
                        END
                    ) AS total_minutes
             FROM time_logs 
             WHERE project_id = $1
             GROUP BY start_time::date
             ORDER BY work_date ASC`,
            [projectId]
        );
        const breakdown = result.rows.map(row => ({
            date: row.work_date,
            total_hours: parseFloat((parseFloat(row.total_minutes) / 60).toFixed(2)),
            total_minutes: Math.round(parseFloat(row.total_minutes))
        }));
        res.json(breakdown);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get per-employee breakdown of hours on a project
// @route   GET /api/time/project/:projectId/employees
// @access  Protected
const getProjectEmployeeBreakdown = async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            `SELECT tl.employee_id, COALESCE(u.name, 'Deleted Employee') AS employee_name,
                    SUM(
                        CASE 
                            WHEN tl.end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - tl.start_time)) / 60
                            ELSE tl.duration_minutes 
                        END
                    ) AS total_minutes
             FROM time_logs tl
             LEFT JOIN users u ON tl.employee_id = u.id
             WHERE tl.project_id = $1
             GROUP BY tl.employee_id, u.name
             ORDER BY total_minutes DESC`,
            [projectId]
        );
        const breakdown = result.rows.map(row => ({
            employee_id: row.employee_id,
            employee_name: row.employee_name,
            total_hours: parseFloat((parseFloat(row.total_minutes) / 60).toFixed(2)),
            total_minutes: Math.round(parseFloat(row.total_minutes))
        }));
        res.json(breakdown);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Edit a time log manually
// @route   PUT /api/time/logs/:id
// @access  Protected (Admin only)
const editTimeLog = async (req, res) => {
    const { id } = req.params;
    const { start_time, end_time, project_id } = req.body;

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Only Admin can edit time logs' });
    }

    try {
        const checkLog = await pool.query('SELECT * FROM time_logs WHERE id = $1', [id]);
        if (checkLog.rows.length === 0) {
            return res.status(404).json({ message: 'Time log not found' });
        }

        const newStart = start_time ? new Date(start_time) : new Date(checkLog.rows[0].start_time);
        const newEnd = end_time ? new Date(end_time) : (checkLog.rows[0].end_time ? new Date(checkLog.rows[0].end_time) : null);
        
        let durationMinutes = 0;
        if (newEnd) {
            durationMinutes = Math.round((newEnd - newStart) / 60000);
        }

        const result = await pool.query(
            `UPDATE time_logs 
             SET start_time = $1, 
                 end_time = $2, 
                 duration_minutes = $3, 
                 project_id = COALESCE($4, project_id)
             WHERE id = $5 RETURNING *`,
            [newStart, newEnd, durationMinutes, project_id || null, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { 
    switchProject, 
    stopProjectTimer, 
    getActiveProjectTimer, 
    getTodayShiftSeconds, 
    getMyProjectsToday,
    getProjectTotalHours, 
    getProjectDailyBreakdown, 
    getProjectEmployeeBreakdown, 
    editTimeLog 
};
