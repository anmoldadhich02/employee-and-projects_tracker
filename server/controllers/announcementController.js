const pool = require('../config/db');

// @desc    Post announcement for a project
// @route   POST /api/projects/:projectId/announcements
// @access  Protected (Admin / Secondary Admin)
const createAnnouncement = async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    try {
        await pool.query('BEGIN');
        
        const newAnnouncement = await pool.query(
            'INSERT INTO announcements (project_id, created_by, content) VALUES ($1, $2, $3) RETURNING *',
            [projectId, req.user.id, content]
        );

        // Notify via notification system
        const projectNameQuery = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);
        const projectName = projectNameQuery.rows[0].name;

        await pool.query(
            "INSERT INTO notifications (type, message, related_id) VALUES ('announcement', $1, $2)",
            [`New announcement posted in ${projectName}`, newAnnouncement.rows[0].id]
        );

        await pool.query('COMMIT');
        res.status(201).json(newAnnouncement.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get announcements for a project
// @route   GET /api/projects/:projectId/announcements
// @access  Protected
const getProjectAnnouncements = async (req, res) => {
    const { projectId } = req.params;

    try {
        const announcements = await pool.query(
            `SELECT a.*, COALESCE(u.name, 'Deleted Employee') as author_name,
                    CASE WHEN nr.id IS NOT NULL THEN TRUE ELSE FALSE END as is_read
             FROM announcements a 
             LEFT JOIN users u ON a.created_by = u.id 
             LEFT JOIN notification_reads nr ON a.id = nr.announcement_id AND nr.employee_id = $2
             WHERE a.project_id = $1 
             ORDER BY a.created_at DESC`,
            [projectId, req.user.id]
        );
        res.json(announcements.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Protected
const markAnnouncementRead = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            'INSERT INTO notification_reads (announcement_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, req.user.id]
        );
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get read receipts for an announcement
// @route   GET /api/announcements/:id/reads
// @access  Protected
const getAnnouncementReads = async (req, res) => {
    const { id } = req.params;

    try {
        const reads = await pool.query(
            `SELECT nr.read_at, u.name as employee_name 
             FROM notification_reads nr
             JOIN users u ON nr.employee_id = u.id
             WHERE nr.announcement_id = $1
             ORDER BY nr.read_at DESC`,
            [id]
        );
        res.json(reads.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get announcement details
// @route   GET /api/announcements/:id
// @access  Protected
const getAnnouncementById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT a.*, COALESCE(u.name, 'Deleted Employee') as author_name, p.name as project_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             LEFT JOIN projects p ON a.project_id = p.id
             WHERE a.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { createAnnouncement, getProjectAnnouncements, markAnnouncementRead, getAnnouncementReads, getAnnouncementById };