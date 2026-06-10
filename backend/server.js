import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import aiRoutes from './routes/ai.routes.js';
import pricePredictionRoutes from './routes/pricePrediction.routes.js';
import negotiationAnalysisRoutes from './routes/negotiationAnalysis.routes.js';
import smartMatchRoutes from './routes/smartMatch.routes.js';
import cropHealthRoutes from './routes/cropHealth.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import agentWorkflowRoutes from './routes/agentWorkflow.routes.js';
import aiCommandRoutes from './routes/aiCommandRoutes.js';

// Import Socket Handler
import { handleSocketConnections } from './socket/socket.handler.js';

// Load environmental variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dynamic development
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Support larger base64 image uploads for crop disease leaves
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Routing Middleware
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/ai/copilot', aiRoutes);
app.use('/api/price-prediction', pricePredictionRoutes);
app.use('/api/negotiation-assistant', negotiationAnalysisRoutes);
app.use('/api/smart-match', smartMatchRoutes);
app.use('/api/crop-health', cropHealthRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/agent-workflow', agentWorkflowRoutes);
app.use('/api/ai-command', aiCommandRoutes);

// Root guide page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>AGRO-LINK API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #050B07; color: #f8fafc; padding: 3rem; text-align: center; }
          .card { max-width: 500px; margin: 4rem auto; background: #0f1f14; border: 1px solid #10b981; border-radius: 16px; padding: 2.5rem; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1); }
          h1 { color: #34d399; margin-bottom: 1rem; font-weight: 800; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
          .btn { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; margin-top: 1.5rem; transition: background 0.2s; }
          .btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>AGRO-LINK Express API</h1>
          <p>You have reached the backend API server. To access the user-facing AGRO-LINK application, please navigate to the frontend portal:</p>
          <a class="btn" href="http://localhost:5174/" target="_blank">Open Frontend Application</a>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AGRO-LINK server is operational' });
});

// Catch-all middleware for non-API routes redirecting to guide page
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health' && req.path !== '/') {
    return res.redirect('/');
  }
  next();
});

// Initialize Socket.io Pipeline
handleSocketConnections(io);

// MongoDB Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrolink';
const PORT = process.env.PORT || 8000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully to:', MONGO_URI);
    // Start Server
    server.listen(PORT, () => {
      console.log(`AGRO-LINK backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });
