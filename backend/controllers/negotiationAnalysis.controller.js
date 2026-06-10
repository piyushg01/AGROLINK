import NegotiationAnalysis from '../models/negotiationAnalysis.model.js';

/**
 * Fetch analysis for a dealer offer from the Flask microservice
 */
export const analyzeOffer = async (req, res) => {
  try {
    const { cropName, dealerOfferedPrice, marketPrice, quantity, location } = req.body;

    if (!cropName || !dealerOfferedPrice || !marketPrice || !quantity || !location) {
      return res.status(400).json({
        success: false,
        message: 'Crop name, offered price, market price, quantity, and location are required.'
      });
    }

    // Call Python AI microservice
    const response = await fetch('http://localhost:5000/api/ai/analyze-negotiation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cropName, dealerOfferedPrice, marketPrice, quantity, location })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error || 'Failed to fetch analysis from AI service.'
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in analyzeOffer controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to contact AI negotiation service.',
      error: error.message
    });
  }
};

/**
 * Save negotiation analysis in MongoDB
 */
export const saveAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      cropName, 
      dealerOfferedPrice, 
      marketPrice, 
      quantity, 
      location,
      differencePct,
      expectedProfit,
      profitDifference,
      riskLevel,
      fairnessScore,
      negotiationScore,
      suggestedCounterOffer,
      recommendation,
      reason
    } = req.body;

    if (
      !cropName || !dealerOfferedPrice || !marketPrice || !quantity || !location || 
      differencePct === undefined || expectedProfit === undefined || profitDifference === undefined || 
      !riskLevel || fairnessScore === undefined || negotiationScore === undefined || 
      suggestedCounterOffer === undefined || !recommendation || !reason
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required analysis fields to save.'
      });
    }

    const analysis = new NegotiationAnalysis({
      user: userId,
      cropName,
      dealerOfferedPrice,
      marketPrice,
      quantity,
      location,
      differencePct,
      expectedProfit,
      profitDifference,
      riskLevel,
      fairnessScore,
      negotiationScore,
      suggestedCounterOffer,
      recommendation,
      reason
    });

    await analysis.save();

    return res.status(201).json({
      success: true,
      message: 'Negotiation analysis saved successfully.',
      analysis
    });
  } catch (error) {
    console.error('Error in saveAnalysis controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save negotiation analysis record.',
      error: error.message
    });
  }
};

/**
 * Get saved negotiation analyses for the current user
 */
export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await NegotiationAnalysis.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error in getAnalysisHistory controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load analysis history.',
      error: error.message
    });
  }
};

/**
 * Delete a saved negotiation analysis record
 */
export const deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const analysis = await NegotiationAnalysis.findOne({ _id: id, user: userId });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or unauthorized.'
      });
    }

    await NegotiationAnalysis.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Analysis record deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteAnalysis controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete analysis record.',
      error: error.message
    });
  }
};
