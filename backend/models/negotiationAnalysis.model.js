import mongoose from 'mongoose';

const NegotiationAnalysisSchema = new mongoose.Schema({
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
  dealerOfferedPrice: {
    type: Number,
    required: true
  },
  marketPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  differencePct: {
    type: Number,
    required: true
  },
  expectedProfit: {
    type: Number,
    required: true
  },
  profitDifference: {
    type: Number,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  fairnessScore: {
    type: Number,
    required: true
  },
  negotiationScore: {
    type: Number,
    required: true
  },
  suggestedCounterOffer: {
    type: Number,
    required: true
  },
  recommendation: {
    type: String,
    enum: ['Accept Offer', 'Negotiate Offer', 'Reject Offer'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NegotiationAnalysis = mongoose.model('NegotiationAnalysis', NegotiationAnalysisSchema);
export default NegotiationAnalysis;
