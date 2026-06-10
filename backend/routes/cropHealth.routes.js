import express from 'express';
import { 
  diagnoseCropHealth, 
  getCropHealthHistory, 
  deleteCropHealthHistory, 
  buyInputProduct 
} from '../controllers/cropHealth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth protection middleware to all crop health routes
router.use(protect);

router.post('/diagnose', diagnoseCropHealth);
router.get('/history', getCropHealthHistory);
router.delete('/history/:id', deleteCropHealthHistory);
router.post('/buy', buyInputProduct);

export default router;
