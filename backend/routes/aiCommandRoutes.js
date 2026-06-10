import express from 'express';
import { generateReport, getHistory, deleteReport } from '../controllers/aiCommandController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/generate', protect, generateReport);
router.get('/history', protect, getHistory);
router.delete('/history/:id', protect, deleteReport);

export default router;
