import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import AiHub from './pages/AiHub';
import NegotiationChat from './pages/NegotiationChat';
import AiCopilotPage from './pages/AiCopilotPage';
import PricePrediction from './pages/PricePrediction';
import NegotiationAssistant from './pages/NegotiationAssistant';
import BuyerMatching from './pages/BuyerMatching';
import CropHealth from './pages/CropHealth';
import WeatherAdvisor from './pages/WeatherAdvisor';
import AgentSystem from './pages/AgentSystem';
import AICommandCenter from './pages/AICommandCenter';

// Import Components
import ChatWidget from './components/ChatWidget';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B07] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Core Platform Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <Marketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-hub"
              element={
                <ProtectedRoute>
                  <AiHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <NegotiationChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-copilot"
              element={
                <ProtectedRoute>
                  <AiCopilotPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/price-prediction"
              element={
                <ProtectedRoute>
                  <PricePrediction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/negotiation-assistant"
              element={
                <ProtectedRoute>
                  <NegotiationAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer-matching"
              element={
                <ProtectedRoute>
                  <BuyerMatching />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crop-health"
              element={
                <ProtectedRoute>
                  <CropHealth />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weather-advisor"
              element={
                <ProtectedRoute>
                  <WeatherAdvisor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent-system"
              element={
                <ProtectedRoute>
                  <AgentSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-command"
              element={
                <ProtectedRoute>
                  <AICommandCenter />
                </ProtectedRoute>
              }
            />

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ChatWidgetWrapper />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

const ChatWidgetWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ChatWidget />;
};

export default App;
