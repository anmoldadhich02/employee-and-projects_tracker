const pool = require('./config/db');

const resetToday = async () => {
    try {
        console.log('Resetting today\'s attendance and time logs to clear broken timezone data...');
        
        // 1. Delete today's attendance
        const attRes = await pool.query('DELETE FROM attendance WHERE date = CURRENT_DATE');
        console.log(`Deleted ${attRes.rowCount} attendance records for today.`);
        
        // 2. Delete today's time logs
        const logRes = await pool.query('DELETE FROM time_logs WHERE start_time::date = CURRENT_DATE');
        console.log(`Deleted ${logRes.rowCount} time log records for today.`);
        
        // 3. Reset all user statuses to Inactive
        await pool.query("UPDATE users SET status = 'Inactive'");
        console.log('Reset all user statuses to Inactive.');
        
        console.log('Database reset successfully! Please restart your server, log in again, and verify the timer.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error.message);
        process.exit(1);
    }
};

resetToday();
