import mongoose from 'mongoose';

const PricePredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cropName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  predictedPrices: {
    tomorrow: { type: Number, required: true },
    threeDay: { type: Number, required: true },
    sevenDay: { type: Number, required: true },
    fifteenDay: { type: Number, required: true }
  },
  recommendation: {
    action: { 
      type: String, 
      enum: ['Hold', 'Sell', 'Neutral'], 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PricePrediction = mongoose.model('PricePrediction', PricePredictionSchema);
export default PricePrediction;
