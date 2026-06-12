const pool = require('../config/db');

// @desc    Create a reusable checklist template
// @route   POST /api/checklists/templates
// @access  Protected (Admin / Secondary Admin)
const createChecklistTemplate = async (req, res) => {
    const { name, tasks } = req.body; // tasks is an array of strings
    
    try {
        const newTemplate = await pool.query(
            'INSERT INTO checklist_templates (name, tasks, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, JSON.stringify(tasks), req.user.id]
        );
        
        res.status(201).json(newTemplate.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all checklist templates
// @route   GET /api/checklists/templates
// @access  Protected
const getChecklistTemplates = async (req, res) => {
    try {
        const templates = await pool.query('SELECT * FROM checklist_templates ORDER BY created_at DESC');
        res.json(templates.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { createChecklistTemplate, getChecklistTemplates };
