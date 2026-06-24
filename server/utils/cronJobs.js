const cron = require('node-cron');
const pool = require('../config/db');

// Runs every 5 minutes to detect and auto-logout any active sessions that have passed 7:00 PM
cron.schedule('*/5 * * * *', async () => {
    console.log('Running Auto-Logout Cron Check...');
    try {
        await pool.query('BEGIN');
        
        const now = new Date();
        
        // 1. Detect and close active project time_logs
        const activeLogs = await pool.query('SELECT * FROM time_logs WHERE end_time IS NULL');
        for (let log of activeLogs.rows) {
            const startTime = new Date(log.start_time);
            
            // Standard shift logout threshold is 7:00 PM on the start date
            const logoutThreshold = new Date(startTime);
            logoutThreshold.setHours(19, 0, 0, 0);
            
            const isDifferentDay = now.toDateString() !== startTime.toDateString();
            const isPastSevenPM = now > logoutThreshold;
            const startedBeforeSevenPM = startTime < logoutThreshold;
            
            // Close if: (1) started on a previous day, OR (2) started today before 7pm and it's now past 7pm
            if (isDifferentDay || (startedBeforeSevenPM && isPastSevenPM)) {
                let endTime = new Date(startTime);
                if (startedBeforeSevenPM) {
                    endTime.setHours(19, 0, 0, 0);
                } else {
                    endTime.setHours(23, 59, 59, 0);
                }
                
                const durationMinutes = Math.round((endTime - startTime) / 60000);
                await pool.query(
                    'UPDATE time_logs SET end_time = $1, duration_minutes = $2 WHERE id = $3',
                    [endTime, Math.max(0, durationMinutes), log.id]
                );
            }
        }

        // 2. Detect and close active attendances, and mark users as Inactive
        const activeAttendances = await pool.query(
            'SELECT id, employee_id, login_time, current_session_start, date FROM attendance WHERE logout_time IS NULL'
        );
        
        for (let att of activeAttendances.rows) {
            const sessionStartVal = att.current_session_start || att.login_time;
            const sessionStartTime = new Date(sessionStartVal);
            
            const attDate = new Date(att.date);
            const logoutThreshold = new Date(attDate);
            logoutThreshold.setHours(19, 0, 0, 0);
            
            const isDifferentDay = now.toDateString() !== attDate.toDateString();
            const isPastSevenPM = now > logoutThreshold;
            const startedBeforeSevenPM = sessionStartTime < logoutThreshold;
            
            // Close if: (1) started on a previous day, OR (2) started today before 7pm and it's now past 7pm
            if (isDifferentDay || (startedBeforeSevenPM && isPastSevenPM)) {
                let logoutTime = new Date(attDate);
                if (startedBeforeSevenPM) {
                    logoutTime.setHours(19, 0, 0, 0);
                } else {
                    logoutTime.setHours(23, 59, 59, 0);
                }
                
                const sessionSeconds = Math.round((logoutTime - sessionStartTime) / 1000);
                
                // Mark user as Inactive
                await pool.query(
                    'UPDATE users SET status = $1 WHERE id = $2',
                    ['Inactive', att.employee_id]
                );

                await pool.query(
                    'UPDATE attendance SET logout_time = $1, worked_seconds = COALESCE(worked_seconds, 0) + $2 WHERE id = $3',
                    [logoutTime, Math.max(0, sessionSeconds), att.id]
                );
            }
        }
        
        // 3. Auto-delete announcements older than 30 days
        const deletedAnn = await pool.query(
            "DELETE FROM announcements WHERE created_at < NOW() - INTERVAL '30 days' RETURNING id"
        );
        if (deletedAnn.rows.length > 0) {
            const deletedIds = deletedAnn.rows.map(r => r.id);
            await pool.query(
                "DELETE FROM notifications WHERE type = 'announcement' AND related_id = ANY($1::int[])",
                [deletedIds]
            );
            console.log(`Auto-deleted ${deletedAnn.rows.length} announcements older than 30 days.`);
        }
        
        await pool.query('COMMIT');
        console.log('Auto-logout and announcement cleanup check completed successfully.');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Cron job error:', error.message);
    }
});