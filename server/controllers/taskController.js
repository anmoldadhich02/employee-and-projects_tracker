const pool = require('../config/db');

// Helper function to update project progress percentage dynamically
const updateProjectProgress = async (projectId) => {
    try {
        const subtasksRes = await pool.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed 
             FROM subtasks s
             JOIN tasks t ON s.task_id = t.id
             WHERE t.project_id = $1`,
            [projectId]
        );
        const { total, completed } = subtasksRes.rows[0];
        const totalCount = parseInt(total);
        const completedCount = parseInt(completed);
        
        let progress = 0;
        if (totalCount > 0) {
            progress = Math.round((completedCount / totalCount) * 100);
        }
        
        await pool.query(
            "UPDATE projects SET progress_percentage = $1 WHERE id = $2",
            [progress, projectId]
        );
    } catch (error) {
        console.error('Failed to update project progress:', error.message);
    }
};

// @desc    Add a Category Task to a project
// @route   POST /api/projects/:projectId/tasks
// @access  Protected
const createTasks = async (req, res) => {
    const { projectId } = req.params;
    const { task_name } = req.body;
    
    if (!task_name || !task_name.trim()) {
        return res.status(400).json({ message: 'Category name is required' });
    }
    
    try {
        await pool.query('BEGIN');
        
        const trimmedName = task_name.trim();
        
        // Auto-save to 'Suggested Tasks' checklist template
        const existingTemplate = await pool.query(
            "SELECT id, tasks FROM checklist_templates WHERE name = 'Suggested Tasks' LIMIT 1"
        );
        
        if (existingTemplate.rows.length > 0) {
            const temp = existingTemplate.rows[0];
            let currentTasks = temp.tasks || [];
            if (!currentTasks.includes(trimmedName)) {
                currentTasks.push(trimmedName);
                await pool.query(
                    "UPDATE checklist_templates SET tasks = $1 WHERE id = $2",
                    [JSON.stringify(currentTasks), temp.id]
                );
            }
        } else {
            await pool.query(
                "INSERT INTO checklist_templates (name, tasks, created_by) VALUES ('Suggested Tasks', $1, $2)",
                [JSON.stringify([trimmedName]), req.user.id]
            );
        }
        
        const result = await pool.query(
            "INSERT INTO tasks (project_id, task_name) VALUES ($1, $2) RETURNING *",
            [projectId, trimmedName]
        );
        
        await pool.query('COMMIT');
        
        // Return structured categories list
        const getTasksResult = await pool.query(
            `SELECT t.id as task_id, t.task_name,
                    s.id as subtask_id, s.subtask_name, s.sheet_no, s.status, s.completed_at
             FROM tasks t
             LEFT JOIN subtasks s ON t.id = s.task_id
             WHERE t.project_id = $1
             ORDER BY t.created_at ASC, s.created_at ASC`,
            [projectId]
        );
        
        const tasksMap = {};
        getTasksResult.rows.forEach(r => {
            if (!tasksMap[r.task_id]) {
                tasksMap[r.task_id] = {
                    id: r.task_id,
                    task_name: r.task_name,
                    subtasks: []
                };
            }
            if (r.subtask_id) {
                tasksMap[r.task_id].subtasks.push({
                    id: r.subtask_id,
                    subtask_name: r.subtask_name,
                    sheet_no: r.sheet_no,
                    status: r.status,
                    completed_at: r.completed_at
                });
            }
        });
        
        res.status(201).json(Object.values(tasksMap));
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a Subtask to a project category
// @route   POST /api/projects/:projectId/subtasks
// @access  Protected
const createSubtask = async (req, res) => {
    const { projectId } = req.params;
    const { task_id, subtask_name, sheet_no } = req.body;
    
    if (!task_id || !subtask_name || !subtask_name.trim()) {
        return res.status(400).json({ message: 'Task ID and Subtask name are required' });
    }
    
    try {
        await pool.query('BEGIN');
        
        const trimmedName = subtask_name.trim();
        const trimmedSheet = sheet_no ? sheet_no.trim() : '';
        
        // Auto-save to 'Suggested Subtasks' checklist template
        const existingTemplate = await pool.query(
            "SELECT id, tasks FROM checklist_templates WHERE name = 'Suggested Subtasks' LIMIT 1"
        );
        
        const subtaskObj = { subtask_name: trimmedName, sheet_no: trimmedSheet };
        
        if (existingTemplate.rows.length > 0) {
            const temp = existingTemplate.rows[0];
            let currentSubtasks = temp.tasks || [];
            const exists = currentSubtasks.some(s => s.subtask_name.toLowerCase() === trimmedName.toLowerCase());
            if (!exists) {
                currentSubtasks.push(subtaskObj);
                await pool.query(
                    "UPDATE checklist_templates SET tasks = $1 WHERE id = $2",
                    [JSON.stringify(currentSubtasks), temp.id]
                );
            }
        } else {
            await pool.query(
                "INSERT INTO checklist_templates (name, tasks, created_by) VALUES ('Suggested Subtasks', $1, $2)",
                [JSON.stringify([subtaskObj]), req.user.id]
            );
        }
        
        await pool.query(
            "INSERT INTO subtasks (task_id, subtask_name, sheet_no) VALUES ($1, $2, $3)",
            [task_id, trimmedName, trimmedSheet]
        );
        
        await updateProjectProgress(projectId);
        
        await pool.query('COMMIT');
        
        // Return structured categories list
        const getTasksResult = await pool.query(
            `SELECT t.id as task_id, t.task_name,
                    s.id as subtask_id, s.subtask_name, s.sheet_no, s.status, s.completed_at
             FROM tasks t
             LEFT JOIN subtasks s ON t.id = s.task_id
             WHERE t.project_id = $1
             ORDER BY t.created_at ASC, s.created_at ASC`,
            [projectId]
        );
        
        const tasksMap = {};
        getTasksResult.rows.forEach(r => {
            if (!tasksMap[r.task_id]) {
                tasksMap[r.task_id] = {
                    id: r.task_id,
                    task_name: r.task_name,
                    subtasks: []
                };
            }
            if (r.subtask_id) {
                tasksMap[r.task_id].subtasks.push({
                    id: r.subtask_id,
                    subtask_name: r.subtask_name,
                    sheet_no: r.sheet_no,
                    status: r.status,
                    completed_at: r.completed_at
                });
            }
        });
        
        res.status(201).json(Object.values(tasksMap));
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
        const result = await pool.query(
            `SELECT t.id as task_id, t.task_name,
                    s.id as subtask_id, s.subtask_name, s.sheet_no, s.status, s.completed_at
             FROM tasks t
             LEFT JOIN subtasks s ON t.id = s.task_id
             WHERE t.project_id = $1
             ORDER BY t.created_at ASC, s.created_at ASC`,
            [projectId]
        );
        
        const tasksMap = {};
        result.rows.forEach(r => {
            if (!tasksMap[r.task_id]) {
                tasksMap[r.task_id] = {
                    id: r.task_id,
                    task_name: r.task_name,
                    subtasks: []
                };
            }
            if (r.subtask_id) {
                tasksMap[r.task_id].subtasks.push({
                    id: r.subtask_id,
                    subtask_name: r.subtask_name,
                    sheet_no: r.sheet_no,
                    status: r.status,
                    completed_at: r.completed_at
                });
            }
        });
        
        res.json(Object.values(tasksMap));
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update subtask status 
// @route   PUT /api/tasks/subtasks/:id
// @access  Protected
const updateSubtaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'In Progress', 'Completed'
    
    try {
        await pool.query('BEGIN');
        
        const completedAt = status === 'Completed' ? new Date() : null;
        const result = await pool.query(
            `UPDATE subtasks 
             SET status = $1, completed_at = $2 
             WHERE id = $3 RETURNING *`,
            [status, completedAt, id]
        );
        
        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Subtask not found' });
        }
        
        // Find project_id
        const taskRes = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [result.rows[0].task_id]);
        const projectId = taskRes.rows[0].project_id;
        
        await updateProjectProgress(projectId);
        
        await pool.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete Category Task
// @route   DELETE /api/tasks/categories/:id
// @access  Protected
const deleteCategoryTask = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('BEGIN');
        
        const checkRes = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const projectId = checkRes.rows[0].project_id;
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        
        await updateProjectProgress(projectId);
        
        await pool.query('COMMIT');
        res.json({ message: 'Category and all subtasks deleted successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete Subtask
// @route   DELETE /api/tasks/subtasks/:id
// @access  Protected
const deleteSubtask = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('BEGIN');
        
        const checkRes = await pool.query(
            'SELECT t.project_id FROM subtasks s JOIN tasks t ON s.task_id = t.id WHERE s.id = $1', 
            [id]
        );
        if (checkRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Subtask not found' });
        }
        
        const projectId = checkRes.rows[0].project_id;
        await pool.query('DELETE FROM subtasks WHERE id = $1', [id]);
        
        await updateProjectProgress(projectId);
        
        await pool.query('COMMIT');
        res.json({ message: 'Subtask deleted successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Apply Checklist Template
// @route   POST /api/projects/:projectId/tasks/apply-template
// @access  Protected
const applyChecklistTemplate = async (req, res) => {
    const { projectId } = req.params;
    const { templateId } = req.body;
    
    if (!templateId) {
        return res.status(400).json({ message: 'Template ID is required' });
    }
    
    try {
        await pool.query('BEGIN');
        
        const tempRes = await pool.query('SELECT tasks FROM checklist_templates WHERE id = $1', [templateId]);
        if (tempRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Template not found' });
        }
        
        const templateStructure = tempRes.rows[0].tasks || []; // Array of { task_name, subtasks }
        
        for (let item of templateStructure) {
            // Insert Category
            const taskRes = await pool.query(
                "INSERT INTO tasks (project_id, task_name) VALUES ($1, $2) RETURNING id",
                [projectId, item.task_name]
            );
            const taskId = taskRes.rows[0].id;
            
            // Insert Subtasks
            if (item.subtasks && Array.isArray(item.subtasks)) {
                for (let sub of item.subtasks) {
                    await pool.query(
                        "INSERT INTO subtasks (task_id, subtask_name, sheet_no, status) VALUES ($1, $2, $3, 'Pending')",
                        [taskId, sub.subtask_name, sub.sheet_no]
                    );
                }
            }
        }
        
        await updateProjectProgress(projectId);
        
        await pool.query('COMMIT');
        
        // Fetch the newly created tasks list to return
        const getTasksResult = await pool.query(
            `SELECT t.id as task_id, t.task_name,
                    s.id as subtask_id, s.subtask_name, s.sheet_no, s.status, s.completed_at
             FROM tasks t
             LEFT JOIN subtasks s ON t.id = s.task_id
             WHERE t.project_id = $1
             ORDER BY t.created_at ASC, s.created_at ASC`,
            [projectId]
        );
        
        const tasksMap = {};
        getTasksResult.rows.forEach(r => {
            if (!tasksMap[r.task_id]) {
                tasksMap[r.task_id] = {
                    id: r.task_id,
                    task_name: r.task_name,
                    subtasks: []
                };
            }
            if (r.subtask_id) {
                tasksMap[r.task_id].subtasks.push({
                    id: r.subtask_id,
                    subtask_name: r.subtask_name,
                    sheet_no: r.sheet_no,
                    status: r.status,
                    completed_at: r.completed_at
                });
            }
        });
        
        res.status(201).json(Object.values(tasksMap));
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { 
    createTasks, 
    createSubtask, 
    getProjectTasks, 
    updateSubtaskStatus, 
    deleteCategoryTask, 
    deleteSubtask, 
    applyChecklistTemplate 
};