import express from 'express';
import { registerUser, loginUser, socialLogin, forgotPassword, requestPasswordReset, changePassword } from '../controllers/userController.js';
import { getUserProfile, updateUserProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/forgot-password', forgotPassword);
router.post('/request-password-reset', requestPasswordReset);
router.post('/change-password', protect, changePassword);

router.route('/profile')
    .post(protect, updateUserProfile);
router.route('/profile/:username')
    .get(protect, getUserProfile);

export default router;
