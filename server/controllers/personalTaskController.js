const pool = require('../config/db');

// @desc    Get all active personal tasks for current user
// @route   GET /api/personal-tasks
// @access  Protected
const getPersonalTasks = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM personal_tasks WHERE user_id = $1 AND completed = FALSE ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new personal task
// @route   POST /api/personal-tasks
// @access  Protected
const createPersonalTask = async (req, res) => {
    const { title } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Task title is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO personal_tasks (user_id, title) VALUES ($1, $2) RETURNING *',
            [req.user.id, title.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update completed status or title of a personal task
// @route   PUT /api/personal-tasks/:id
// @access  Protected
const updatePersonalTask = async (req, res) => {
    const { id } = req.params;
    const { completed, title } = req.body;

    try {
        const checkResult = await pool.query('SELECT user_id FROM personal_tasks WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (checkResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        let query = 'UPDATE personal_tasks SET ';
        const params = [];
        let paramCount = 1;

        if (completed !== undefined) {
            query += `completed = $${paramCount}, `;
            params.push(completed === true);
            paramCount++;
        }
        if (title !== undefined && title.trim()) {
            query += `title = $${paramCount}, `;
            params.push(title.trim());
            paramCount++;
        }

        if (params.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        query = query.slice(0, -2); // Remove trailing comma and space
        query += ` WHERE id = $${paramCount} RETURNING *`;
        params.push(id);

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a personal task
// @route   DELETE /api/personal-tasks/:id
// @access  Protected
const deletePersonalTask = async (req, res) => {
    const { id } = req.params;

    try {
        const checkResult = await pool.query('SELECT user_id FROM personal_tasks WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (checkResult.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await pool.query('DELETE FROM personal_tasks WHERE id = $1', [id]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getPersonalTasks,
    createPersonalTask,
    updatePersonalTask,
    deletePersonalTask
};
