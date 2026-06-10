import express from 'express';
import { askCopilot, getChatHistory, clearChatHistory } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware globally to all AI Copilot operations
router.use(protect);

router.post('/ask', askCopilot);
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);

export default router;
