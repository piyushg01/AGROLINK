import mongoose from 'mongoose';

const copilotChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
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

const CopilotChat = mongoose.model('CopilotChat', copilotChatSchema);
export default CopilotChat;
