import User from '../models/user.model.js';
import SmartMatch from '../models/smartMatch.model.js';

/**
 * Execute AI Buyer Matching algorithm
 */
export const findMatches = async (req, res) => {
  try {
    const { cropName, quantity } = req.body;
    const farmerId = req.user.id;

    if (!cropName || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Crop name and quantity are required.'
      });
    }

    // 1. Get Farmer's coordinates
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found.'
      });
    }

    const farmerCoords = farmer.location?.coordinates || [73.8850, 18.7250];

    // 2. Fetch all registered dealers
    const dealers = await User.find({ role: 'dealer' });
    if (dealers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered dealers found in database.'
      });
    }

    // 3. Format dealers for Flask microservice
    const formattedDealers = dealers.map(d => ({
      id: d._id,
      name: d.name,
      coordinates: d.location?.coordinates || [73.0012, 19.0308],
      trustScore: d.trustScore || 80,
      rating: d.rating || 4.0,
      previousTransactions: d.previousTransactions || 5,
      multiplier: d.averageOfferPriceMultiplier || 1.0
    }));

    // 4. Contact Python AI matching service
    const response = await fetch('http://localhost:5000/api/ai/match-buyers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cropName,
        quantity: parseFloat(quantity),
        farmerCoords,
        dealers: formattedDealers
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error || 'Failed to compute matching algorithm.'
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error in findMatches controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to contact AI matching service.',
      error: error.message
    });
  }
};

/**
 * Save buyer matching snapshot to MongoDB
 */
export const saveMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cropName, quantity, farmerCoords, matches } = req.body;

    if (!cropName || !quantity || !farmerCoords || !matches) {
      return res.status(400).json({
        success: false,
        message: 'Missing required matching snapshot fields to save.'
      });
    }

    const smartMatch = new SmartMatch({
      user: userId,
      cropName,
      quantity,
      location: farmerCoords,
      matches: matches.map(m => ({
        dealer: m.dealerId,
        name: m.name,
        distanceKm: m.distanceKm,
        offeredPrice: m.offeredPrice,
        rating: m.rating,
        trustScore: m.trustScore,
        previousTransactions: m.previousTransactions,
        isBestProfit: m.isBestProfit,
        isFastestSale: m.isFastestSale
      }))
    });

    await smartMatch.save();

    return res.status(201).json({
      success: true,
      message: 'Buyer matching snapshot saved successfully.',
      smartMatch
    });
  } catch (error) {
    console.error('Error in saveMatch controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save matching record.',
      error: error.message
    });
  }
};

/**
 * Get saved matching history for current farmer
 */
export const getMatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await SmartMatch.find({ user: userId })
      .populate('matches.dealer', 'phone address') // populate phone for easy dealer sourcing
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error in getMatchHistory controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load matching history.',
      error: error.message
    });
  }
};

/**
 * Delete a saved matching snapshot
 */
export const deleteMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const snapshot = await SmartMatch.findOne({ _id: id, user: userId });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Matching record not found or unauthorized.'
      });
    }

    await SmartMatch.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Matching record deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteMatch controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete matching record.',
      error: error.message
    });
  }
};
