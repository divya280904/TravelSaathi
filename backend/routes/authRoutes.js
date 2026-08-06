import express from 'express';
import { startOAuth, handleOAuthCallback } from '../controllers/oauthController.js';

const router = express.Router();

router.get('/oauth/:provider', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

export default router;