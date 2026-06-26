const pool = require('../config/db');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/jwtToken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');

// Configure multer storage for candidate profile images
const uploadProfileDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadProfileDir)) {
    fs.mkdirSync(uploadProfileDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadProfileDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadProfile = multer({
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|heic/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/heic';
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const getLocalDateString = (d = new Date()) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)) AND is_deleted = FALSE',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid name or password' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid name or password' });
        }

        // Set user status to Working in the database
        await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['Working', user.id]);

        // Attendance auto-login logic
        const today = getLocalDateString();
        const existingAttendance = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
            [user.id, today]
        );

        if (existingAttendance.rows.length === 0) {
            await pool.query(
                'INSERT INTO attendance (employee_id, date, login_time, current_session_start, worked_seconds) VALUES ($1, $2, NOW(), NOW(), 0)',
                [user.id, today]
            );
        } else if (existingAttendance.rows[0].logout_time !== null) {
            // Already logged out once today, reset current_session_start to NOW() and logout_time to NULL to resume work
            await pool.query(
                'UPDATE attendance SET current_session_start = NOW(), logout_time = NULL WHERE id = $1',
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
            profile_image_url: user.profile_image_url,
            token: generateToken(user.id, user.role),
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const createEmployee = async (req, res) => {
    const { name, email, phone_number, designation, password, role } = req.body;
    const profile_image_url = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, phone_number, designation, password, role, profile_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, profile_image_url',
            [name, email, phone_number, designation, hashedPassword, role || 'Employee', profile_image_url]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const getEmployees = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone_number, designation, role, status, profile_image_url FROM users WHERE is_deleted = FALSE ORDER BY created_at DESC');
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
        const today = getLocalDateString();
        const attRes = await pool.query(
            'SELECT current_session_start, login_time FROM attendance WHERE employee_id = $1 AND date = $2',
            [req.user.id, today]
        );

        if (attRes.rows.length > 0) {
            const sessionStartVal = attRes.rows[0].current_session_start || attRes.rows[0].login_time;
            const sessionStartTime = new Date(sessionStartVal);
            const currentSessionSeconds = Math.round((new Date() - sessionStartTime) / 1000);
            await pool.query(
                'UPDATE attendance SET logout_time = NOW(), worked_seconds = COALESCE(worked_seconds, 0) + $1 WHERE employee_id = $2 AND date = $3',
                [currentSessionSeconds, req.user.id, today]
            );
        } else {
            await pool.query(
                'UPDATE attendance SET logout_time = NOW() WHERE employee_id = $1 AND date = $2',
                [req.user.id, today]
            );
        }

        // Update user status to Inactive in the database
        await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['Inactive', req.user.id]);

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
    return res.status(400).json({ message: 'Employee status cannot be set manually. It is automatically managed by login and logout activity.' });
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
        const today = getLocalDateString();
        const workingCountQuery = await pool.query(
            `SELECT COUNT(DISTINCT a.employee_id) 
             FROM attendance a
             JOIN users u ON a.employee_id = u.id
             WHERE a.date = $1 AND a.logout_time IS NULL AND u.role != 'Admin' AND u.is_deleted = FALSE`,
            [today]
        );
        const workingCount = parseInt(workingCountQuery.rows[0].count);

        // 3. Total Hours Logged Today (in seconds, converted to hours)
        const totalHoursQuery = await pool.query(
            `SELECT COALESCE(SUM(
                CASE 
                    WHEN a.logout_time IS NULL THEN COALESCE(a.worked_seconds, 0) + EXTRACT(EPOCH FROM (NOW() - COALESCE(a.current_session_start, a.login_time)))
                    ELSE COALESCE(a.worked_seconds, 0)
                END
            ), 0) / 3600.0 AS total_hours
            FROM attendance a
            JOIN users u ON a.employee_id = u.id
            WHERE a.date = $1 AND u.role != 'Admin' AND u.is_deleted = FALSE`,
            [today]
        );
        const totalHours = parseFloat(parseFloat(totalHoursQuery.rows[0].total_hours).toFixed(2));

        // 4. Site Visits Today
        const siteVisitsQuery = await pool.query(
            "SELECT COUNT(*) FROM site_visits WHERE visit_date = $1",
            [today]
        );
        const siteVisitsCount = parseInt(siteVisitsQuery.rows[0].count);

        // 5. Completed Tasks
        const completedTasksQuery = await pool.query(
            "SELECT COUNT(*) FROM subtasks WHERE status = 'Completed'"
        );
        const completedTasksCount = parseInt(completedTasksQuery.rows[0].count);

        // 6. Live Employee Status panel list
        const liveEmployeesQuery = await pool.query(
            `SELECT u.id, u.name, u.email, u.designation, u.role, u.status, u.profile_image_url,
                    a.login_time,
                    a.logout_time,
                    a.worked_seconds,
                    a.current_session_start,
                    tl.start_time AS active_timer_start,
                    p.name AS current_project_name,
                    (
                        SELECT s.subtask_name FROM subtasks s
                        JOIN tasks t ON s.task_id = t.id
                        WHERE t.project_id = tl.project_id AND s.status = 'In Progress' 
                        ORDER BY s.created_at DESC LIMIT 1
                    ) AS current_task_name
             FROM users u
             LEFT JOIN attendance a ON u.id = a.employee_id AND a.date = $1
             LEFT JOIN time_logs tl ON u.id = tl.employee_id AND tl.end_time IS NULL
             LEFT JOIN projects p ON tl.project_id = p.id
             WHERE u.role != 'Admin' AND u.is_deleted = FALSE
             ORDER BY u.name ASC`,
            [today]
        );

        const liveEmployees = liveEmployeesQuery.rows.map(emp => {
            const isWorking = emp.login_time !== null && emp.logout_time === null;
            let shiftHours = 0;
            if (emp.login_time) {
                let totalSeconds = emp.worked_seconds || 0;
                if (!emp.logout_time) {
                    const sessionStartVal = emp.current_session_start || emp.login_time;
                    totalSeconds += Math.round((new Date() - new Date(sessionStartVal)) / 1000);
                }
                shiftHours = parseFloat((totalSeconds / 3600).toFixed(2));
            }
            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                designation: emp.designation,
                role: emp.role,
                status: emp.status,
                profile_image_url: emp.profile_image_url,
                is_working: isWorking,
                current_project: emp.current_project_name || null,
                current_task: emp.current_task_name || null,
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

        // Get assigned and active workers for each project
        const assignmentsQuery = await pool.query(
            `SELECT DISTINCT project_id, name, email FROM (
                 SELECT pa.project_id, u.name, u.email 
                 FROM project_assignments pa 
                 JOIN users u ON pa.employee_id = u.id
                 UNION
                 SELECT tl.project_id, u.name, u.email
                 FROM time_logs tl
                 JOIN users u ON tl.employee_id = u.id
                 WHERE tl.project_id IS NOT NULL
             ) combined_users`
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

// @desc    Delete an employee and clean up all their files and cascaded references
// @route   DELETE /api/users/:id
// @access  Protected (Admin only)
const deleteEmployee = async (req, res) => {
    const { id } = req.params;

    // Check if the user is attempting to delete themselves
    if (req.user.id === parseInt(id)) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    try {
        // Find if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userToDelete = userCheck.rows[0];
        // Protect Owner Admins from being deleted if necessary
        if (userToDelete.role === 'Admin') {
            return res.status(403).json({ message: 'Owner Admins cannot be deleted' });
        }

        // 1. Perform database soft-delete
        // We set status='Inactive', is_deleted=TRUE, and rename the email to prevent unique constraint conflicts
        const deletedEmail = `${userToDelete.email}_deleted_${Date.now()}`;
        await pool.query(
            "UPDATE users SET status = 'Inactive', is_deleted = TRUE, email = $1 WHERE id = $2",
            [deletedEmail, id]
        );

        res.json({ message: `Staff member ${userToDelete.name} deleted successfully` });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const openNetworkFolder = async (req, res) => {
    console.log('[openNetworkFolder] Endpoint hit!');
    try {
        const folderPath = process.env.NETWORK_FOLDER_PATH || '/Users/anmoldadhich/Desktop/network folder';
        console.log(`[openNetworkFolder] Path: ${folderPath}`);
        
        // Wrap folder check/creation in a separate try-catch so it doesn't block opening
        try {
            const isNetworkPath = folderPath.startsWith('\\\\') || folderPath.startsWith('//');
            if (!isNetworkPath && !fs.existsSync(folderPath)) {
                console.log('[openNetworkFolder] Path does not exist. Creating...');
                fs.mkdirSync(folderPath, { recursive: true });
                console.log('[openNetworkFolder] Path created.');
            }
        } catch (dirError) {
            console.warn('[openNetworkFolder] Warning during directory check/creation:', dirError.message);
        }
        
        let command;
        if (process.platform === 'win32') {
            // Windows expects backslashes for path
            const winPath = folderPath.replace(/\//g, '\\');
            // Use 'start' command, which is a shell builtin and returns exit code 0 when successful
            command = `start "" "${winPath}"`;
        } else if (process.platform === 'darwin') {
            command = `open "${folderPath}"`;
        } else {
            command = `xdg-open "${folderPath}"`;
        }

        console.log(`[openNetworkFolder] Executing command: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[openNetworkFolder] Failed to open folder error: ${error.message}`);
                console.error(`[openNetworkFolder] stderr: ${stderr}`);
                return res.status(500).json({ message: 'Failed to open directory', error: error.message });
            }
            console.log('[openNetworkFolder] Command run successfully.');
            res.json({ message: 'Directory opened successfully' });
        });
    } catch (error) {
        console.error('[openNetworkFolder] Caught error:', error.message);
        res.status(500).send('Server Error: ' + error.message);
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone_number, designation, role } = req.body;
    const profile_image_url = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;

    try {
        // 1. Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userCheck.rows[0];

        // 2. Prevent role changes or modifications of Owner Admin (role === 'Admin') by Secondary Admin
        if (user.role === 'Admin' && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Owner Admin can modify Owner Admin accounts' });
        }

        // 3. Check if email conflicts with another user
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const emailCheck = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another user' });
            }
        }

        // 4. Update the user details
        let query;
        let params;
        if (profile_image_url !== undefined) {
            query = `
                UPDATE users 
                SET name = $1, email = $2, phone_number = $3, designation = $4, role = $5, profile_image_url = $6
                WHERE id = $7
                RETURNING id, name, email, phone_number, designation, role, profile_image_url, status
            `;
            params = [
                name || user.name, 
                email || user.email, 
                phone_number || user.phone_number, 
                designation || user.designation, 
                role || user.role, 
                profile_image_url,
                id
            ];
        } else {
            query = `
                UPDATE users 
                SET name = $1, email = $2, phone_number = $3, designation = $4, role = $5
                WHERE id = $6
                RETURNING id, name, email, phone_number, designation, role, profile_image_url, status
            `;
            params = [
                name || user.name, 
                email || user.email, 
                phone_number || user.phone_number, 
                designation || user.designation, 
                role || user.role, 
                id
            ];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const listNetworkFiles = async (req, res) => {
    try {
        const rootPath = process.env.NETWORK_FOLDER_PATH || '/Users/anmoldadhich/Desktop/network folder';
        const queryPath = req.query.path || '';
        
        // Resolve target path to prevent traversal
        const resolvedPath = path.resolve(rootPath, queryPath);
        if (!resolvedPath.startsWith(path.resolve(rootPath))) {
            return res.status(403).json({ message: 'Access denied: Directory traversal detected' });
        }

        if (!fs.existsSync(resolvedPath)) {
            // If the root network path doesn't exist, create it. If it's a subpath, return error.
            if (resolvedPath === path.resolve(rootPath)) {
                try {
                    fs.mkdirSync(resolvedPath, { recursive: true });
                } catch (mkdirErr) {
                    console.error('[listNetworkFiles] Failed to create root network path:', mkdirErr.message);
                    return res.status(404).json({ 
                        message: 'Network folder path is currently offline or unreachable. Please verify your connection to ' + rootPath 
                    });
                }
            } else {
                return res.status(404).json({ message: 'Directory not found' });
            }
        }

        const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
        const files = entries.map(entry => {
            const entryPath = path.join(resolvedPath, entry.name);
            let size = 0;
            let mtime = new Date();
            try {
                const stats = fs.statSync(entryPath);
                size = stats.size;
                mtime = stats.mtime;
            } catch (e) {
                // Ignore stat errors for broken links/locked files
            }
            return {
                name: entry.name,
                isDir: entry.isDirectory(),
                size: size,
                modifiedAt: mtime
            };
        });

        // Sort: directories first, then alphabetically
        files.sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
        });

        res.json({
            currentPath: queryPath,
            files
        });
    } catch (error) {
        console.error('[listNetworkFiles] Error:', error.message);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

const downloadNetworkFile = async (req, res) => {
    try {
        const rootPath = process.env.NETWORK_FOLDER_PATH || '/Users/anmoldadhich/Desktop/network folder';
        const filePath = req.query.file || '';

        if (!filePath) {
            return res.status(400).json({ message: 'File parameter is required' });
        }

        const resolvedPath = path.resolve(rootPath, filePath);
        if (!resolvedPath.startsWith(path.resolve(rootPath))) {
            return res.status(403).json({ message: 'Access denied: Directory traversal detected' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const stat = fs.statSync(resolvedPath);
        if (stat.isDirectory()) {
            return res.status(400).json({ message: 'Cannot download a directory' });
        }

        res.download(resolvedPath, path.basename(resolvedPath));
    } catch (error) {
        console.error('[downloadNetworkFile] Error:', error.message);
        res.status(500).json({ message: 'Server Error: ' + error.message });
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
    getDashboardStats,
    deleteEmployee,
    uploadProfile,
    openNetworkFolder,
    updateEmployee,
    listNetworkFiles,
    downloadNetworkFile
};
