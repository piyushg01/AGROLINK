import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  triggerAgentWorkflow,
  getWorkflowHistory,
  deleteWorkflowRun
} from '../controllers/agentWorkflow.controller.js';

const router = express.Router();

// Apply auth protection globally
router.use(protect);

router.post('/run', triggerAgentWorkflow);
router.get('/history', getWorkflowHistory);
router.delete('/history/:id', deleteWorkflowRun);

export default router;
