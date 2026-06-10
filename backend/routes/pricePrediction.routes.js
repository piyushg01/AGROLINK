import express from 'express';
import { 
  predictCropPrice, 
  savePrediction, 
  getPredictionHistory, 
  deletePrediction 
} from '../controllers/pricePrediction.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All price prediction routes require user authentication
router.use(protect);

router.post('/predict', predictCropPrice);
router.post('/save', savePrediction);
router.get('/history', getPredictionHistory);
router.delete('/history/:id', deletePrediction);

export default router;
