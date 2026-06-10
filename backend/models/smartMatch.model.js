import mongoose from 'mongoose';

const SmartMatchSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true
  },
  location: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  matches: [
    {
      dealer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      distanceKm: {
        type: Number,
        required: true
      },
      offeredPrice: {
        type: Number,
        required: true
      },
      rating: {
        type: Number,
        required: true
      },
      trustScore: {
        type: Number,
        required: true
      },
      previousTransactions: {
        type: Number,
        required: true
      },
      isBestProfit: {
        type: Boolean,
        default: false
      },
      isFastestSale: {
        type: Boolean,
        default: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SmartMatch = mongoose.model('SmartMatch', SmartMatchSchema);
export default SmartMatch;
