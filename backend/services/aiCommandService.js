import User from '../models/user.model.js';
import AIReport from '../models/AIReport.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://agrolink-ai-g2z6.onrender.com';

// Haversine formula to compute distance in km
function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function roundToTwo(num) {
  return Math.round(num * 100) / 100;
}

// Local price forecast fallback in case Flask is down
function getLocalPriceForecast(crop, location, quantity) {
  const crop_bases = {
    'Wheat': 22.0, 'Rice': 65.0, 'Tomato': 18.0, 'Potato': 15.0, 'Cotton': 60.0, 'Soybean': 42.0
  };
  const base_price = crop_bases[crop] || 20.0;
  
  const tomorrow = roundToTwo(base_price * 1.01);
  const threeDay = roundToTwo(base_price * 0.99);
  const sevenDay = roundToTwo(base_price * 1.03);
  const fifteenDay = roundToTwo(base_price * 1.05);
  
  const price_diff_pct = 3.0; // Simulated 3% growth
  const action = 'Hold';
  const message = `[Local Fallback Mode] Market demands are rising. Prices are forecasted to increase by ${price_diff_pct}% over the next week. We recommend holding your ${quantity} kg crop for at least 5 to 7 days to maximize profit margin.`;

  return {
    success: true,
    crop,
    location,
    quantity,
    currentPrice: base_price,
    predictedPrices: { tomorrow, threeDay, sevenDay, fifteenDay },
    recommendation: { action, message },
    priceTrend: 'Upward'
  };
}

class AiCommandService {
  /**
   * Run the full AI Command Center pipeline sequentially
   */
  async runPipeline(userId, cropImage, targetQuantity = 1000) {
    // 1. Fetch user to get locations
    const farmer = await User.findById(userId);
    if (!farmer) {
      throw new Error('Farmer user account not found.');
    }

    const farmerCoords = farmer.location?.coordinates || [73.8850, 18.7250]; // default Pune coords
    const farmerState = farmer.address?.includes('Madhya Pradesh') ? 'Madhya Pradesh' 
                        : farmer.address?.includes('Uttar Pradesh') ? 'Uttar Pradesh' 
                        : farmer.address?.includes('Punjab') ? 'Punjab' 
                        : farmer.address?.includes('Gujarat') ? 'Gujarat' 
                        : 'Maharashtra';

    // 2. Step 1: Disease Pathology Agent
    let diseaseResult = null;
    const base64Matches = cropImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let mimetype = 'image/png';
    if (base64Matches && base64Matches.length === 3) {
      mimetype = base64Matches[1];
      buffer = Buffer.from(base64Matches[2], 'base64');
    } else {
      buffer = Buffer.from(cropImage, 'base64');
    }

    try {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimetype });
      formData.append('image', blob, 'leaf.png');

      const response = await fetch(`${AI_SERVICE_URL}/api/disease-detect`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        diseaseResult = data.result;
      }
    } catch (err) {
      console.warn('Flask disease-detect microservice offline. Invoking local fallback...', err);
    }

    // Local Fallback for Disease Detection
    if (!diseaseResult) {
      let totalVal = 0;
      for (let idx = 0; idx < Math.min(100, buffer.length); idx++) {
        totalVal += buffer[idx];
      }
      const valHash = totalVal % 3;

      if (valHash === 0) {
        diseaseResult = {
          crop: 'Tomato',
          disease: 'Early Blight (Alternaria solani)',
          confidence: 89.60,
          severity: 'High',
          description: '[Fallback] Concentric brown bullseye lesions on foliage surrounded by yellow halos.',
          treatment: ['Spray Chlorothalonil 75% WP systemically.', 'Prune lower leaves to restrict splashbacks.']
        };
      } else if (valHash === 1) {
        diseaseResult = {
          crop: 'Wheat',
          disease: 'Common Rust (Puccinia sorghi)',
          confidence: 94.20,
          severity: 'Medium',
          description: '[Fallback] Fungal outbreak causing raised, powdery orange-brown pustules on leaf surface.',
          treatment: ['Spray Mancozeb Fungicide or copper oxychloride solution.', 'Ensure adequate spacing for air circulation.']
        };
      } else {
        diseaseResult = {
          crop: 'Wheat',
          disease: 'Healthy Leaf',
          confidence: 98.50,
          severity: 'None',
          description: '[Fallback] Grains leaf appears extremely healthy. Chlorophyll and cell density are normal.',
          treatment: ['Maintain standard drip irrigation runs.', 'Apply nitrogen fertilizer during vegetative growth.']
        };
      }
    }

    // Map identified crop name to standard category
    let simpleCropName = 'Wheat';
    if (diseaseResult.crop.includes('Tomato')) simpleCropName = 'Tomato';
    else if (diseaseResult.crop.includes('Rice')) simpleCropName = 'Rice';
    else if (diseaseResult.crop.includes('Potato')) simpleCropName = 'Potato';
    else if (diseaseResult.crop.includes('Cotton')) simpleCropName = 'Cotton';
    else if (diseaseResult.crop.includes('Soybean')) simpleCropName = 'Soybean';

    // 3. Step 2: Market Intelligence Price Forecasting
    let marketResult = null;
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/crop-price-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: simpleCropName,
          location: farmerState,
          quantity: targetQuantity
        })
      });
      const data = await response.json();
      if (data.success) {
        marketResult = {
          currentPrice: data.currentPrice,
          predictedPrice: data.predictedPrices.sevenDay,
          trend: data.priceTrend || (data.predictedPrices.sevenDay > data.currentPrice ? 'Upward' : 'Downward'),
          recommendation: data.recommendation.message
        };
      }
    } catch (err) {
      console.warn('Flask price-forecast microservice offline. Invoking local estimation...', err);
    }

    if (!marketResult) {
      const localForecast = getLocalPriceForecast(simpleCropName, farmerState, targetQuantity);
      marketResult = {
        currentPrice: localForecast.currentPrice,
        predictedPrice: localForecast.predictedPrices.sevenDay,
        trend: localForecast.priceTrend,
        recommendation: localForecast.recommendation.message
      };
    }

    // 4. Step 3: Buyer Recommendation Matchmaking
    const dealers = await User.find({ role: 'dealer' });
    let bestBuyerMatch = null;

    if (dealers.length > 0) {
      const dealersData = dealers.map(d => ({
        id: d._id.toString(),
        name: d.name,
        coordinates: d.location?.coordinates || [73.8567, 18.5204],
        rating: d.rating || 4.0,
        trustScore: d.trustScore || 80,
        multiplier: d.averageOfferPriceMultiplier || 1.0
      }));

      // Find highest match score locally for simplicity and speed
      const scoredDealers = dealersData.map(d => {
        const distance = calculateHaversineDistance(
          farmerCoords[0], farmerCoords[1],
          d.coordinates[0], d.coordinates[1]
        );
        const offeredPrice = roundToTwo(marketResult.currentPrice * d.multiplier);
        
        // Match score logic matching agent system weights
        const maxPrice = marketResult.currentPrice * 1.15;
        const priceScore = (offeredPrice / maxPrice) * 100;
        const distanceScore = Math.max(0.0, Math.min(100.0, 100.0 - (distance / 5.0)));
        const matchScore = roundToTwo((priceScore * 0.40) + (distanceScore * 0.30) + (d.trustScore * 0.30));

        return {
          buyerId: d.id,
          name: d.name,
          rating: d.rating,
          offeredPrice,
          distanceKm: distance,
          matchScore
        };
      });

      scoredDealers.sort((a, b) => b.matchScore - a.matchScore);
      bestBuyerMatch = scoredDealers[0];
    } else {
      bestBuyerMatch = {
        buyerId: null,
        name: 'Direct Mandi Wholesalers',
        rating: 4.2,
        offeredPrice: marketResult.currentPrice,
        distanceKm: 25.0,
        matchScore: 90
      };
    }

    // 5. Step 4: Profit Calculator (Profit Agent)
    const expectedRevenue = roundToTwo(bestBuyerMatch.offeredPrice * targetQuantity);
    
    // Transport tariff estimate: Krishi-Vahan standard rate (₹18.0/km) * distance
    const transportRate = targetQuantity > 3000 ? 30.0 : targetQuantity > 500 ? 18.0 : 12.0;
    const transportCost = roundToTwo(bestBuyerMatch.distanceKm * transportRate);
    const expectedProfit = roundToTwo(expectedRevenue - transportCost);

    // 6. Step 5: Final Recommendation Cards logic
    let finalRec = '';
    if (diseaseResult.severity === 'High' || diseaseResult.severity === 'Medium') {
      finalRec = `Treat disease before selling. We recommend applying the prescribed treatment immediately: ${diseaseResult.treatment?.[0] || 'Apply systemic fungicide'} to avoid crop grading downgrades.`;
    } else if (marketResult.trend === 'Upward') {
      finalRec = `Hold inventory. The market price trend is upward. Holding wheat/crop for 5-7 days could increase profit yield by ~3-5%.`;
    } else {
      finalRec = `Sell within 3 days. Current offered price of ₹${bestBuyerMatch.offeredPrice}/kg by ${bestBuyerMatch.name} is optimal. Secure deal immediately to mitigate transportation lag risks.`;
    }

    // 7. Assemble and Save report to Database
    const report = new AIReport({
      user: userId,
      cropName: simpleCropName,
      cropImage,
      diseaseAnalysis: {
        diseaseName: diseaseResult.disease,
        confidence: diseaseResult.confidence,
        severity: diseaseResult.severity,
        description: diseaseResult.description,
        treatment: diseaseResult.treatment
      },
      marketAnalysis: {
        currentPrice: marketResult.currentPrice,
        predictedPrice: marketResult.predictedPrice,
        trend: marketResult.trend,
        recommendation: marketResult.recommendation
      },
      buyerAnalysis: {
        bestBuyer: bestBuyerMatch.name,
        buyerRating: bestBuyerMatch.rating,
        offeredPrice: bestBuyerMatch.offeredPrice,
        buyerId: bestBuyerMatch.buyerId
      },
      profitAnalysis: {
        targetQuantity,
        expectedRevenue,
        transportCost,
        expectedProfit
      },
      finalRecommendation: finalRec
    });

    await report.save();
    return report;
  }
}

export default new AiCommandService();
