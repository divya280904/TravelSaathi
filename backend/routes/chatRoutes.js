import express from 'express';
import { getUserChats, getChatMessages, sendMessage, removeParticipant } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getUserChats);

router.route('/:chatRoomId')
    .get(protect, getChatMessages);

router.route('/:chatRoomId/message')
    .post(protect, sendMessage);

router.route('/:chatRoomId/participants')
    .post(protect, removeParticipant);

export default router;
