const pool = require('../config/db');

// @desc    Get metrics for Admin Dashboard
// @route   GET /api/dashboard/admin
// @access  Protected (Admin / Secondary Admin)
const getAdminDashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Active Projects Count
        const activeProjectsInfo = await pool.query("SELECT COUNT(*) FROM projects WHERE status = 'Active'");
        
        // 2. Employees Currently Working (Active Timers)
        const workingEmployees = await pool.query("SELECT COUNT(DISTINCT employee_id) FROM time_logs WHERE end_time IS NULL");

        // 3. Completed Tasks Today
        const completedTasksInfo = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'Completed' AND DATE(created_at) = $1", [today]);

        // 4. Live Employee Status (Who is working on what right now)
        const liveStatus = await pool.query(`
            SELECT u.name as employee_name, p.name as project_name, t.task_name, tl.start_time 
            FROM time_logs tl
            JOIN users u ON tl.employee_id = u.id
            JOIN projects p ON tl.project_id = p.id
            JOIN tasks t ON tl.task_id = t.id
            WHERE tl.end_time IS NULL
        `);

        // 5. Total Hours Logged Today
        const hoursLogged = await pool.query(`
            SELECT SUM(duration_minutes) as total_minutes 
            FROM time_logs 
            WHERE DATE(start_time) = $1 AND end_time IS NOT NULL
        `, [today]);

        const totalHours = Math.round((hoursLogged.rows[0].total_minutes || 0) / 60);

        res.json({
            stats: {
                activeProjects: activeProjectsInfo.rows[0].count,
                employeesWorking: workingEmployees.rows[0].count,
                completedTasksToday: completedTasksInfo.rows[0].count,
                totalHoursToday: totalHours
            },
            liveActivity: liveStatus.rows
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getAdminDashboard };
