const express = require('express');
const router = express.Router();
const { markAnnouncementRead, getAnnouncementReads, getAnnouncementById } = require('../controllers/announcementController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/:id/read', protect, markAnnouncementRead);
router.get('/:id/reads', protect, getAnnouncementReads);
router.get('/:id', protect, getAnnouncementById);

module.exports = router;