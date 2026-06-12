const pool = require('../config/db');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Protected (Admin / Secondary Admin / Employee)
const createProject = async (req, res) => {
    const { name, site_engineer_contact, location, start_date, status, assigned_employees } = req.body;
    
    try {
        await pool.query('BEGIN');
        
        const newProject = await pool.query(
            'INSERT INTO projects (name, site_engineer_contact, location, start_date, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, site_engineer_contact, location, start_date, status || 'Active', req.user.id]
        );
        
        const projectId = newProject.rows[0].id;

        // Assign employees if provided
        if (assigned_employees && assigned_employees.length > 0) {
            for (let empId of assigned_employees) {
                await pool.query(
                    'INSERT INTO project_assignments (project_id, employee_id) VALUES ($1, $2)',
                    [projectId, empId]
                );
            }
        }
        
        await pool.query('COMMIT');
        res.status(201).json(newProject.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Protected
const getProjects = async (req, res) => {
    try {
        let query = 'SELECT * FROM projects ORDER BY created_at DESC';
        if (req.user.role === 'Employee') {
            // Employees only see projects they created or are assigned to
            query = `
                SELECT DISTINCT p.* FROM projects p
                LEFT JOIN project_assignments pa ON p.id = pa.project_id
                WHERE p.created_by = $1 OR pa.employee_id = $1
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query, [req.user.id]);
            return res.json(result.rows);
        }
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a project (Progress, Status, etc.)
// @route   PUT /api/projects/:id
// @access  Protected (Admin / Secondary Admin)
const updateProject = async (req, res) => {
    const { id } = req.params;
    const { progress_percentage, status, name, location, site_engineer_contact } = req.body;
    
    try {
        const updateQuery = `
            UPDATE projects 
            SET progress_percentage = COALESCE($1, progress_percentage), 
                status = COALESCE($2, status),
                name = COALESCE($3, name),
                location = COALESCE($4, location),
                site_engineer_contact = COALESCE($5, site_engineer_contact)
            WHERE id = $6 RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [progress_percentage, status, name, location, site_engineer_contact, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { createProject, getProjects, updateProject };
