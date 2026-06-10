import express from 'express';
import { 
  analyzeOffer, 
  saveAnalysis, 
  getAnalysisHistory, 
  deleteAnalysis 
} from '../controllers/negotiationAnalysis.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Require user authentication for all negotiation assistant routes
router.use(protect);

router.post('/analyze', analyzeOffer);
router.post('/save', saveAnalysis);
router.get('/history', getAnalysisHistory);
router.delete('/history/:id', deleteAnalysis);

export default router;
