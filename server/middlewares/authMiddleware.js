const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user is active in the database
            const userRes = await pool.query('SELECT status FROM users WHERE id = $1', [decoded.id]);
            if (userRes.rows.length === 0 || userRes.rows[0].status === 'Inactive') {
                return res.status(401).json({ message: 'Session expired' });
            }

            req.user = decoded; // Contains id and role
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Secondary Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as secondary admin' });
    }
};

module.exports = { protect, admin, superAdmin };
