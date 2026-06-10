import express from 'express';
import { 
  findMatches, 
  saveMatch, 
  getMatchHistory, 
  deleteMatch 
} from '../controllers/smartMatch.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Require user authentication for all buyer matching routes
router.use(protect);

router.post('/match', findMatches);
router.post('/save', saveMatch);
router.get('/history', getMatchHistory);
router.delete('/history/:id', deleteMatch);

export default router;
