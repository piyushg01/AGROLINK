import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['farmer', 'dealer', 'shopkeeper'],
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      default: [73.8567, 18.5204], // Default to Pune, Maharashtra coordinates
    },
  },
  trustScore: {
    type: Number,
    default: 80,
  },
  rating: {
    type: Number,
    default: 4.0,
  },
  previousTransactions: {
    type: Number,
    default: 5,
  },
  averageOfferPriceMultiplier: {
    type: Number,
    default: 1.0,
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'en',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Geolocation Indexing for nearby shopkeepers search
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);
export default User;
