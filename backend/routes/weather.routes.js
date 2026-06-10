import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  checkWeatherAdvisory,
  getWeatherHistory,
  deleteWeatherLog
} from '../controllers/weather.controller.js';

const router = express.Router();

// Apply auth protection globally
router.use(protect);

router.post('/check', checkWeatherAdvisory);
router.get('/history', getWeatherHistory);
router.delete('/history/:id', deleteWeatherLog);

export default router;
