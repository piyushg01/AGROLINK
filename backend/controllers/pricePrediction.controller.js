import PricePrediction from '../models/pricePrediction.model.js';

/**
 * Fetch ML predictions from Flask service
 */
export const predictCropPrice = async (req, res) => {
  try {
    const { cropName, location, quantity } = req.body;

    if (!cropName || !location || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Crop name, location, and quantity are required.'
      });
    }

    // Call Python AI microservice
    const response = await fetch('http://localhost:5000/api/crop-price-forecast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cropName, location, quantity })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error || 'Failed to fetch predictions from AI service.'
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in predictCropPrice controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to contact crop forecasting service.',
      error: error.message
    });
  }
};

/**
 * Save prediction calculation in MongoDB
 */
export const savePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropName, location, quantity, currentPrice, predictedPrices, recommendation } = req.body;

    if (!cropName || !location || !quantity || !currentPrice || !predictedPrices || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required prediction fields to save.'
      });
    }

    const prediction = new PricePrediction({
      user: userId,
      cropName,
      location,
      quantity,
      currentPrice,
      predictedPrices,
      recommendation
    });

    await prediction.save();

    return res.status(201).json({
      success: true,
      message: 'Prediction saved successfully.',
      prediction
    });
  } catch (error) {
    console.error('Error in savePrediction controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save prediction record.',
      error: error.message
    });
  }
};

/**
 * Get saved predictions history for current user
 */
export const getPredictionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await PricePrediction.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error in getPredictionHistory controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load prediction history.',
      error: error.message
    });
  }
};

/**
 * Delete a saved prediction record
 */
export const deletePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const prediction = await PricePrediction.findOne({ _id: id, user: userId });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction record not found or unauthorized.'
      });
    }

    await PricePrediction.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Prediction record deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deletePrediction controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete prediction record.',
      error: error.message
    });
  }
};
