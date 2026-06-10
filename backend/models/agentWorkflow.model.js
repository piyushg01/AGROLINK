import mongoose from 'mongoose';

const agentWorkflowSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cropImage: {
    type: String, // base64 string
    required: true,
  },
  targetQuantity: {
    type: Number,
    required: true,
    default: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  },
  progress: {
    type: Number,
    default: 0,
  },
  agents: {
    disease: {
      status: {
        type: String,
        enum: ['idle', 'running', 'completed', 'failed'],
        default: 'idle',
      },
      result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      logs: {
        type: [String],
        default: [],
      },
    },
    market: {
      status: {
        type: String,
        enum: ['idle', 'running', 'completed', 'failed'],
        default: 'idle',
      },
      result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      logs: {
        type: [String],
        default: [],
      },
    },
    buyer: {
      status: {
        type: String,
        enum: ['idle', 'running', 'completed', 'failed'],
        default: 'idle',
      },
      result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      logs: {
        type: [String],
        default: [],
      },
    },
    logistics: {
      status: {
        type: String,
        enum: ['idle', 'running', 'completed', 'failed'],
        default: 'idle',
      },
      result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      logs: {
        type: [String],
        default: [],
      },
    },
  },
  finalReport: {
    type: String, // Consolidated summary report text
    default: '',
  },
}, { timestamps: true });

const AgentWorkflow = mongoose.model('AgentWorkflow', agentWorkflowSchema);
export default AgentWorkflow;
