const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage for site visit photos
const uploadDir = path.join(__dirname, '../uploads/site-visits');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'visit-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/heic';
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @desc    Create a new site visit (with optional photos)
// @route   POST /api/projects/:projectId/site-visits
// @access  Protected
const createSiteVisit = async (req, res) => {
    const { projectId } = req.params;
    const { visit_date, visit_time, mom } = req.body;
    const photo_urls = req.files ? req.files.map(file => `/uploads/site-visits/${file.filename}`) : [];

    try {
        const newVisit = await pool.query(
            'INSERT INTO site_visits (project_id, employee_id, visit_date, visit_time, mom, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [projectId, req.user.id, visit_date, visit_time, mom, JSON.stringify(photo_urls)]
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
            `SELECT sv.*, COALESCE(u.name, 'Deleted Employee') as employee_name 
             FROM site_visits sv 
             LEFT JOIN users u ON sv.employee_id = u.id 
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
// @access  Protected (Admin / Creator)
const updateSiteVisit = async (req, res) => {
    const { id } = req.params;
    const { visit_date, visit_time, mom, deleted_photos } = req.body;
    
    try {
        const visitCheck = await pool.query('SELECT employee_id, photo_url FROM site_visits WHERE id = $1', [id]);
        if (visitCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Site visit not found' });
        }
        if (req.user.role !== 'Admin' && visitCheck.rows[0].employee_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this site visit' });
        }

        // Handle deleting specific photos
        let currentPhotos = [];
        try {
            currentPhotos = visitCheck.rows[0].photo_url 
                ? (Array.isArray(visitCheck.rows[0].photo_url) 
                    ? visitCheck.rows[0].photo_url 
                    : JSON.parse(visitCheck.rows[0].photo_url)) 
                : [];
        } catch (_) {}

        if (deleted_photos) {
            let toDelete = [];
            try {
                toDelete = Array.isArray(deleted_photos) 
                    ? deleted_photos 
                    : JSON.parse(deleted_photos);
            } catch (_) {
                if (typeof deleted_photos === 'string') {
                    toDelete = [deleted_photos];
                }
            }

            for (const url of toDelete) {
                const filePath = path.join(__dirname, '..', url);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    }
                }
            }
            currentPhotos = currentPhotos.filter(p => !toDelete.includes(p));
        }

        // Handle adding new photos
        if (req.files && req.files.length > 0) {
            const newPhotoUrls = req.files.map(file => `/uploads/site-visits/${file.filename}`);
            currentPhotos = [...currentPhotos, ...newPhotoUrls];
        }

        const result = await pool.query(
            'UPDATE site_visits SET visit_date = COALESCE($1, visit_date), visit_time = COALESCE($2, visit_time), mom = COALESCE($3, mom), photo_url = $4 WHERE id = $5 RETURNING *',
            [visit_date, visit_time, mom, JSON.stringify(currentPhotos), id]
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
// @access  Protected (Admin / Creator)
const deleteSiteVisit = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get the visit first to delete the photo files if they exist and check authorization
        const visit = await pool.query('SELECT employee_id, photo_url FROM site_visits WHERE id = $1', [id]);
        if (visit.rows.length === 0) {
            return res.status(404).json({ message: 'Site visit not found' });
        }
        if (req.user.role !== 'Admin' && visit.rows[0].employee_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this site visit' });
        }

        if (visit.rows[0].photo_url) {
            const photos = Array.isArray(visit.rows[0].photo_url) 
                ? visit.rows[0].photo_url 
                : JSON.parse(visit.rows[0].photo_url || '[]');
            
            for (const photoUrl of photos) {
                const filePath = path.join(__dirname, '..', photoUrl);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    }
                }
            }
        }

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

module.exports = { createSiteVisit, getProjectSiteVisits, updateSiteVisit, deleteSiteVisit, upload };