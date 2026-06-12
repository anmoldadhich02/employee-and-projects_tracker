const pool = require('../config/db');

// @desc    Create a new site visit
// @route   POST /api/projects/:projectId/site-visits
// @access  Protected
const createSiteVisit = async (req, res) => {
    const { projectId } = req.params;
    const { visit_date, visit_time, mom } = req.body;

    try {
        const newVisit = await pool.query(
            'INSERT INTO site_visits (project_id, employee_id, visit_date, visit_time, mom) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [projectId, req.user.id, visit_date, visit_time, mom]
        );
        res.status(201).json(newVisit.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get site visits for a project
// @route   GET /api/projects/:projectId/site-visits
// @access  Protected
const getProjectSiteVisits = async (req, res) => {
    const { projectId } = req.params;
    
    try {
        const visits = await pool.query(
            `SELECT sv.*, u.name as employee_name 
             FROM site_visits sv 
             JOIN users u ON sv.employee_id = u.id 
             WHERE sv.project_id = $1 
             ORDER BY sv.visit_date DESC, sv.visit_time DESC`,
            [projectId]
        );
        res.json(visits.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Edit a site visit
// @route   PUT /api/site-visits/:id
// @access  Protected (Admin / Secondary Admin)
const updateSiteVisit = async (req, res) => {
    const { id } = req.params;
    const { visit_date, visit_time, mom } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE site_visits SET visit_date = COALESCE($1, visit_date), visit_time = COALESCE($2, visit_time), mom = COALESCE($3, mom) WHERE id = $4 RETURNING *',
            [visit_date, visit_time, mom, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Site visit not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a site visit
// @route   DELETE /api/site-visits/:id
// @access  Protected (Admin / Secondary Admin)
const deleteSiteVisit = async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('DELETE FROM site_visits WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Site visit not found' });
        }
        res.json({ message: 'Site visit deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { createSiteVisit, getProjectSiteVisits, updateSiteVisit, deleteSiteVisit };