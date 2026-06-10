import mongoose from 'mongoose';

const weatherHistorySchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  locationName: {
    type: String,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  windSpeed: {
    type: Number,
    required: true,
  },
  rainProbability: {
    type: Number,
    required: true,
  },
  condition: {
    type: String,
    required: true,
  },
  advisory: {
    summary: { type: String, default: '' },
    irrigation: { type: String, default: '' },
    fertilization: { type: String, default: '' },
    pestRisk: { type: String, default: '' },
  },
  forecast: [
    {
      date: { type: String },
      tempMax: { type: Number },
      tempMin: { type: Number },
      precipitationProbability: { type: Number },
      precipitationSum: { type: Number },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WeatherHistory = mongoose.model('WeatherHistory', weatherHistorySchema);
export default WeatherHistory;
