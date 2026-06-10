import mongoose from 'mongoose';

const aiReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
  },
  cropImage: {
    type: String, // Store base64 representation of leaf image
    default: '',
  },
  diseaseAnalysis: {
    diseaseName: { type: String, required: true },
    confidence: { type: Number, required: true },
    severity: { type: String, required: true },
    description: { type: String, default: '' },
    treatment: { type: [String], default: [] },
  },
  marketAnalysis: {
    currentPrice: { type: Number, required: true },
    predictedPrice: { type: Number, required: true },
    trend: { type: String, required: true }, // e.g. Upward, Downward, Neutral
    recommendation: { type: String, default: '' },
  },
  buyerAnalysis: {
    bestBuyer: { type: String, required: true },
    buyerRating: { type: Number, required: true },
    offeredPrice: { type: Number, required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  profitAnalysis: {
    targetQuantity: { type: Number, required: true },
    expectedRevenue: { type: Number, required: true },
    transportCost: { type: Number, required: true },
    expectedProfit: { type: Number, required: true },
  },
  finalRecommendation: {
    type: String, // e.g. "Sell within 3 days", "Treat disease before selling", "Hold inventory"
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AIReport = mongoose.model('AIReport', aiReportSchema);
export default AIReport;
