import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markNotificationsAsRead, streamNotifications } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/stream', protect, streamNotifications);
router.get('/', protect, getNotifications);
router.put('/read', protect, markNotificationsAsRead);

export default router;
