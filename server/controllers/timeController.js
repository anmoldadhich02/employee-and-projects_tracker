const pool = require('../config/db');

// @desc    Start logging time for a project & task
// @route   POST /api/time/start
// @access  Protected (Employee)
const startTimer = async (req, res) => {
    const { projectId, taskId } = req.body;
    
    try {
        await pool.query('BEGIN');
        
        // Check if there is already an active timer for this employee
        const activeLog = await pool.query(
            'SELECT * FROM time_logs WHERE employee_id = $1 AND end_time IS NULL',
            [req.user.id]
        );

        if (activeLog.rows.length > 0) {
            // Stop the previous timer
            const oldLogId = activeLog.rows[0].id;
            const startTime = new Date(activeLog.rows[0].start_time);
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / 60000);

            await pool.query(
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                [endTime, durationMinutes, oldLogId]
            );
        }

        // Start new timer
        const newLog = await pool.query(
            'INSERT INTO time_logs (employee_id, project_id, task_id, start_time) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [req.user.id, projectId, taskId]
        );
        
        await pool.query('COMMIT');
        
        res.status(201).json(newLog.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Stop timer manually (e.g., stopping work without logging out)
// @route   POST /api/time/stop
// @access  Protected
const stopTimer = async (req, res) => {
    try {
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
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3 RETURNING *',
                [endTime, durationMinutes, oldLogId]
            );
            return res.json({ message: 'Timer stopped', durationMinutes });
        }
        res.json({ message: 'No active timer found' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { startTimer, stopTimer };
