const cron = require('node-cron');
const pool = require('../config/db');

// Runs every day at 19:30 (7:30 PM) system time
cron.schedule('30 19 * * *', async () => {
    console.log('Running 7:30 PM Auto-Logout Cron Job...');
    try {
        await pool.query('BEGIN');
        
        // 1. Stop all active time_logs
        const activeLogs = await pool.query('SELECT * FROM time_logs WHERE end_time IS NULL');
        
        for (let log of activeLogs.rows) {
            const startTime = new Date(log.start_time);
            const endTime = new Date(); // Current time (which is ~ 7:30 PM)
            const durationMinutes = Math.round((endTime - startTime) / 60000);
            
            await pool.query(
                'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                [endTime, durationMinutes, log.id]
            );
        }

        // 2. Stop all active attendances for today and mark users as Inactive
        const today = new Date().toISOString().split('T')[0];
        const activeAttendances = await pool.query(
            'SELECT id, employee_id, login_time FROM attendance WHERE date = $1 AND logout_time IS NULL',
            [today]
        );
        
        for (let att of activeAttendances.rows) {
            await pool.query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['Inactive', att.employee_id]
            );

            const loginTime = new Date(att.login_time);
            const sessionSeconds = Math.round((new Date() - loginTime) / 1000);
            await pool.query(
                'UPDATE attendance SET logout_time = NOW(), worked_seconds = COALESCE(worked_seconds, 0) + $1 WHERE id = $2',
                [sessionSeconds, att.id]
            );
        }
        
        await pool.query('COMMIT');
        console.log('Auto-logout completed successfully.');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Cron job error:', error.message);
    }
});