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
        
        // Emitting notification for Admin (can be handled via Socket.io later)
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

module.exports = { loginUser, createEmployee, getEmployees, logoutUser };
