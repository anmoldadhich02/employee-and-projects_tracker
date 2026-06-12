const pool = require('../config/db');

// @desc    Add tasks to a project (manual or via template)
// @route   POST /api/projects/:projectId/tasks
// @access  Protected
const createTasks = async (req, res) => {
    const { projectId } = req.params;
    const { tasks, templateId } = req.body; // tasks = ['Task 1', 'Task 2']
    
    try {
        await pool.query('BEGIN');
        
        let tasksToInsert = [];
        
        if (templateId) {
            const template = await pool.query('SELECT tasks FROM checklist_templates WHERE id = $1', [templateId]);
            if (template.rows.length > 0) {
                tasksToInsert = template.rows[0].tasks;
            }
        } else if (tasks && tasks.length > 0) {
            tasksToInsert = tasks;
        }

        const insertedTasks = [];
        for (let taskName of tasksToInsert) {
            const result = await pool.query(
                "INSERT INTO tasks (project_id, task_name, status) VALUES ($1, $2, 'Pending') RETURNING *",
                [projectId, taskName]
            );
            insertedTasks.push(result.rows[0]);
        }
        
        await pool.query('COMMIT');
        res.status(201).json(insertedTasks);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Protected
const getProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update task status 
// @route   PUT /api/tasks/:id
// @access  Protected
const updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pending' or 'Completed'
    
    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { createTasks, getProjectTasks, updateTaskStatus };