const express = require('express');
const router = express.Router();
const { markAnnouncementRead } = require('../controllers/announcementController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/:id/read', protect, markAnnouncementRead);

module.exports = router;