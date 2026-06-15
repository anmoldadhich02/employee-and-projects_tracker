const pool = require('../config/db');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/jwtToken');

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        
        if (user.status === 'Inactive') {
            return res.status(403).json({ message: 'User account is inactive. Contact Administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Attendance auto-login logic
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
            [user.id, today]
        );

        if (existingAttendance.rows.length === 0) {
            await pool.query(
                'INSERT INTO attendance (employee_id, date, login_time) VALUES ($1, $2, NOW())',
                [user.id, today]
            );
        } else if (existingAttendance.rows[0].logout_time !== null) {
            // Already logged out once today, reset logout time to resume work
            await pool.query(
                'UPDATE attendance SET logout_time = NULL WHERE id = $1',
                [existingAttendance.rows[0].id]
            );
        }


        
        // Emitting notification for Admin
        await pool.query(
            "INSERT INTO notifications (type, message, related_id) VALUES ('login', $1, $2)",
            [user.name + ' logged in', user.id]
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role),
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createEmployee = async (req, res) => {
    const { name, email, phone_number, designation, password, role } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, phone_number, designation, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role',
            [name, email, phone_number, designation, hashedPassword, role || 'Employee']
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getEmployees = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone_number, designation, role, status FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

const logoutUser = async (req, res) => {
    try {
        // Stop any active time logs
        const activeLog = await pool.query(
            'SELECT * FROM time_logs WHERE employee_id = $1 AND end_time IS NULL',
            [req.user.id]
        );

        if (activeLog.rows.length > 0) {
            const oldLogId = activeLog.rows[0].id;
            const startTime = new Date(activeLog.rows[0].start_time);
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / 60000);

            await pool.query(
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                [endTime, durationMinutes, oldLogId]
            );
        }

        // Finalize attendance for today
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
            'UPDATE attendance SET logout_time = NOW() WHERE employee_id = $1 AND date = $2',
            [req.user.id, today]
        );

        // Add to notifications
        const user = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        if(user.rows.length > 0) {
            await pool.query(
                "INSERT INTO notifications (type, message, related_id) VALUES ('logout', $1, $2)",
                [user.rows[0].name + ' logged out', req.user.id]
            );
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update employee role (Promote/Demote)
// @route   PUT /api/users/:id/role
// @access  Protected (Admin only)
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // 'Secondary Admin' or 'Employee'

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Only Admin can change user roles' });
    }

    if (!['Secondary Admin', 'Employee'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle employee status (Working/Inactive)
// @route   PUT /api/users/:id/status
// @access  Protected (Admin / Super Admin)
const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Working' or 'Inactive'

    if (!['Working', 'Inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Prevent editing Admin status
        const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (targetUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.rows[0].role === 'Admin') {
            return res.status(403).json({ message: 'Cannot deactivate Admin account' });
        }

        const result = await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, status',
            [status, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Reset password
// @route   PUT /api/users/:id/reset-password
// @access  Protected (Admin only)
const resetUserPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Only Admin can reset passwords' });
    }

    if (!password || password.trim().length < 4) {
        return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email',
            [hashedPassword, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/users/dashboard
// @access  Protected (Admin / Super Admin)
const getDashboardStats = async (req, res) => {
    try {
        // 1. Active Projects Count
        const activeProjectsQuery = await pool.query(
            "SELECT COUNT(*) FROM projects WHERE status = 'Active'"
        );
        const activeProjectsCount = parseInt(activeProjectsQuery.rows[0].count);

        // 2. Employees Currently Working Count
        const workingCountQuery = await pool.query(
            "SELECT COUNT(DISTINCT employee_id) FROM attendance WHERE date = CURRENT_DATE AND logout_time IS NULL"
        );
        const workingCount = parseInt(workingCountQuery.rows[0].count);

        // 3. Total Hours Logged Today (in minutes, converted to hours)
        const totalHoursQuery = await pool.query(
            `SELECT COALESCE(SUM(
                EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time)) / 3600
            ), 0) AS total_hours
            FROM attendance
            WHERE date = CURRENT_DATE`
        );
        const totalHours = parseFloat(parseFloat(totalHoursQuery.rows[0].total_hours).toFixed(2));

        // 4. Site Visits Today
        const siteVisitsQuery = await pool.query(
            "SELECT COUNT(*) FROM site_visits WHERE visit_date = CURRENT_DATE"
        );
        const siteVisitsCount = parseInt(siteVisitsQuery.rows[0].count);

        // 5. Completed Tasks
        const completedTasksQuery = await pool.query(
            "SELECT COUNT(*) FROM tasks WHERE status = 'Completed'"
        );
        const completedTasksCount = parseInt(completedTasksQuery.rows[0].count);

        // 6. Live Employee Status panel list
        const liveEmployeesQuery = await pool.query(
            `SELECT u.id, u.name, u.email, u.designation, u.role, u.status,
                    a.login_time,
                    a.logout_time,
                    tl.start_time AS active_timer_start,
                    p.name AS current_project_name
             FROM users u
             LEFT JOIN attendance a ON u.id = a.employee_id AND a.date = CURRENT_DATE
             LEFT JOIN time_logs tl ON u.id = tl.employee_id AND tl.end_time IS NULL
             LEFT JOIN projects p ON tl.project_id = p.id
             WHERE u.role != 'Admin'
             ORDER BY u.name ASC`
        );

        const liveEmployees = liveEmployeesQuery.rows.map(emp => {
            const isWorking = emp.login_time !== null && emp.logout_time === null;
            let shiftHours = 0;
            if (emp.login_time) {
                const endTime = emp.logout_time ? new Date(emp.logout_time) : new Date();
                shiftHours = parseFloat(((endTime - new Date(emp.login_time)) / 3600000).toFixed(2));
            }
            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                designation: emp.designation,
                role: emp.role,
                status: emp.status,
                is_working: isWorking,
                current_project: emp.current_project_name || null,
                active_session_minutes: emp.active_timer_start ? Math.round((new Date() - new Date(emp.active_timer_start)) / 60000) : 0,
                total_hours_today: shiftHours
            };
        });

        // 7. Project Overview list
        const projectsQuery = await pool.query(
            "SELECT * FROM projects ORDER BY created_at DESC"
        );

        // Get total hours logged for each project
        const projectHoursQuery = await pool.query(
            `SELECT project_id, 
                    COALESCE(SUM(
                        CASE 
                            WHEN end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
                            ELSE duration_minutes 
                        END
                    ), 0) / 60.0 AS total_hours 
             FROM time_logs 
             WHERE project_id IS NOT NULL
             GROUP BY project_id`
        );
        const projectHours = {};
        projectHoursQuery.rows.forEach(row => {
            projectHours[row.project_id] = parseFloat(parseFloat(row.total_hours).toFixed(2));
        });

        // Get assigned members for each project
        const assignmentsQuery = await pool.query(
            `SELECT pa.project_id, u.name, u.email 
             FROM project_assignments pa 
             JOIN users u ON pa.employee_id = u.id`
        );
        const projectAssignments = {};
        assignmentsQuery.rows.forEach(row => {
            if (!projectAssignments[row.project_id]) {
                projectAssignments[row.project_id] = [];
            }
            projectAssignments[row.project_id].push(row.name);
        });

        const projectOverview = projectsQuery.rows.map(proj => {
            return {
                id: proj.id,
                name: proj.name,
                location: proj.location,
                site_engineer_contact: proj.site_engineer_contact,
                start_date: proj.start_date,
                progress_percentage: proj.progress_percentage,
                status: proj.status,
                total_hours: projectHours[proj.id] || 0,
                assigned_team: projectAssignments[proj.id] || []
            };
        });

        // 8. Notifications list
        const notificationsQuery = await pool.query(
            "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 25"
        );

        res.json({
            stats: {
                active_projects: activeProjectsCount,
                employees_working: workingCount,
                total_hours_today: totalHours,
                site_visits_today: siteVisitsCount,
                completed_tasks: completedTasksCount
            },
            live_employees: liveEmployees,
            projects: projectOverview,
            notifications: notificationsQuery.rows
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { 
    loginUser, 
    createEmployee, 
    getEmployees, 
    logoutUser,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
    getDashboardStats
};
