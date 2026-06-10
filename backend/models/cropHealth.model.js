import mongoose from 'mongoose';

const cropHealthSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
  },
  disease: {
    type: String,
    required: true,
    trim: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  severity: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  symptoms: {
    type: [String],
    default: [],
  },
  treatment: {
    type: [String],
    default: [],
  },
  estimatedCost: {
    type: String,
    required: true,
  },
  recommendedFertilizers: {
    type: [String],
    default: [],
  },
  recommendedPesticides: {
    type: [String],
    default: [],
  },
  image: {
    type: String, // Store base64 representation of leaf image
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CropHealth = mongoose.model('CropHealth', cropHealthSchema);
export default CropHealth;
