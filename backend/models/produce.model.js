import mongoose from 'mongoose';

const produceSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['Grain', 'Vegetable', 'Fruit', 'Pulses', 'Oilseeds', 'Spice'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Base64 or URL
    default: '',
  },
  address: {
    type: String,
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: [73.8567, 18.5204],
  },
  status: {
    type: String,
    enum: ['Available', 'Sold'],
    default: 'Available',
  },
  detectedQuality: {
    type: String,
    default: '',
  },
  detectedGrade: {
    type: String,
    default: '',
  },
  suggestedPrice: {
    type: Number,
    default: 0,
  },
  aiVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Produce = mongoose.model('Produce', produceSchema);
export default Produce;
