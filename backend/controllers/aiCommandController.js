import aiCommandService from '../services/aiCommandService.js';
import AIReport from '../models/AIReport.js';

/**
 * Trigger AI Command Center Pipeline
 * POST /api/ai-command/generate
 */
export const generateReport = async (req, res) => {
  try {
    const { cropImage, targetQuantity } = req.body;
    if (!cropImage) {
      return res.status(400).json({ success: false, error: 'No crop leaf image provided.' });
    }

    const report = await aiCommandService.runPipeline(req.user.id, cropImage, targetQuantity);
    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('AI Command Center pipeline execution failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error during AI pipeline.' });
  }
};

/**
 * Retrieve User AI Reports History
 * GET /api/ai-command/history
 */
export const getHistory = async (req, res) => {
  try {
    const history = await AIReport.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Fetch AI reports history failed:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve AI Command Center history.' });
  }
};

/**
 * Delete Saved AI Report Log
 * DELETE /api/ai-command/history/:id
 */
export const deleteReport = async (req, res) => {
  try {
    const report = await AIReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'AI Report record not found.' });
    }

    if (report.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this report.' });
    }

    await report.deleteOne();
    res.status(200).json({
      success: true,
      message: 'AI Report successfully deleted.'
    });
  } catch (error) {
    console.error('Delete AI report failed:', error);
    res.status(500).json({ success: false, error: 'Failed to purge AI report record.' });
  }
};
