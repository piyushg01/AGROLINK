import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Bot, RefreshCw, LogOut, ArrowRight, Calendar, Trash2, 
  Sparkles, ShieldAlert, Compass, Play, Printer, AlertCircle 
} from 'lucide-react';

// Import our custom sub-components
import AIWorkflow from '../components/AIWorkflow';
import { 
  CropUploadCard, 
  DiseaseAnalysisCard, 
  MarketIntelligenceCard, 
  BuyerRecommendationCard, 
  ProfitCalculatorCard, 
  FinalRecommendationCard 
} from '../components/AnalysisCards';

const AICommandCenter = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Inputs
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(1000);

  // States
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle, running, completed, failed
  const [activeStep, setActiveStep] = useState(0);
  const [reportResult, setReportResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch History
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem('agrolink_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/ai-command/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch AI reports history:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedPreset(null);
    setErrorMessage('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setCropImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Presets trigger
  const applyPreset = (presetType) => {
    setSelectedPreset(presetType);
    setErrorMessage('');
    let imagePath = '';
    
    if (presetType === 'wheat_rust') {
      imagePath = '/samples/rust_leaf.png';
      setImagePreview(imagePath);
      setCropImage(MOCK_BASE64_SAMPLES.wheat_rust);
    } else if (presetType === 'tomato_blight') {
      imagePath = '/samples/blight_leaf.png';
      setImagePreview(imagePath);
      setCropImage(MOCK_BASE64_SAMPLES.tomato_blight);
    } else {
      imagePath = '/samples/healthy_leaf.png';
      setImagePreview(imagePath);
      setCropImage(MOCK_BASE64_SAMPLES.healthy_spinach);
    }
  };

  // Run full Command Center pipeline
  const triggerAnalysis = async () => {
    if (!cropImage) {
      setErrorMessage('Please select a leaf preset or upload an image to start.');
      return;
    }

    setErrorMessage('');
    setPipelineStatus('running');
    setReportResult(null);

    // Mock progress visual sequence steps
    const stepDelays = [
      { step: 1, delay: 600 },
      { step: 2, delay: 1200 },
      { step: 3, delay: 1800 },
      { step: 4, delay: 2400 },
      { step: 5, delay: 2800 }
    ];

    stepDelays.forEach(({ step, delay }) => {
      setTimeout(() => {
        setActiveStep(step);
      }, delay);
    });

    const token = localStorage.getItem('agrolink_token');
    try {
      const response = await fetch('http://localhost:8000/api/ai-command/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropImage,
          targetQuantity
        })
      });

      const data = await response.json();
      if (!data.success) {
        setPipelineStatus('failed');
        setErrorMessage(data.error || 'Failed to execute Command Center pipeline.');
        return;
      }

      // Buffer completion for smooth loader animations
      setTimeout(() => {
        setPipelineStatus('completed');
        setReportResult(data.report);
        fetchHistory();
      }, 3000);

    } catch (err) {
      console.error('API connection failure:', err);
      setPipelineStatus('failed');
      setErrorMessage('Critical connection failure. Backend API server is offline.');
    }
  };

  const loadSavedReport = (report) => {
    setPipelineStatus('completed');
    setReportResult(report);
    setImagePreview(report.cropImage);
    setCropImage(report.cropImage);
    setTargetQuantity(report.profitAnalysis.targetQuantity);
    setActiveStep(5);
  };

  const deleteSavedReport = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('agrolink_token');
    try {
      const response = await fetch(`http://localhost:8000/api/ai-command/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchHistory();
        if (reportResult && reportResult._id === id) {
          setReportResult(null);
          setPipelineStatus('idle');
          setImagePreview('');
          setCropImage(null);
          setSelectedPreset(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete report run:', err);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navbar */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/crop-health" className="hover:text-emerald-400 transition-colors">{t('navCropHealth')}</Link>
          <Link to="/ai-command" className="text-emerald-400 font-bold">{t('navAiCommandCenter')}</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800/40 p-1 rounded-lg border border-slate-700">
            {['en', 'hi', 'mr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                  language === lang ? 'bg-emerald-500 text-white' : 'text-slate-400'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg bg-red-950/20 border border-red-900/40 hover:bg-red-900/40 text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Grid Container */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Banner Title */}
        <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
          <h1 className="text-xl font-black text-white uppercase tracking-wider">{t('aiCommandCenterTitle')}</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-4xl">{t('aiCommandCenterDesc')}</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span className="text-xs font-bold">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Crop Upload Panel */}
          <div className="lg:col-span-4">
            <CropUploadCard
              cropImage={cropImage}
              imagePreview={imagePreview}
              targetQuantity={targetQuantity}
              setTargetQuantity={setTargetQuantity}
              handleImageChange={handleImageChange}
              applyPreset={applyPreset}
              triggerAnalysis={triggerAnalysis}
              isLoading={pipelineStatus === 'running'}
            />
          </div>

          {/* Right Column: Workflow track + Diagnostic Analysis Cards */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* AI Progress Tracker */}
            <AIWorkflow activeStep={activeStep} status={pipelineStatus} />

            {/* Analysis output cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DiseaseAnalysisCard 
                data={reportResult?.diseaseAnalysis} 
                isLoading={pipelineStatus === 'running' && activeStep < 2} 
              />
              <MarketIntelligenceCard 
                data={reportResult?.marketAnalysis} 
                isLoading={pipelineStatus === 'running' && activeStep < 3} 
              />
              <BuyerRecommendationCard 
                data={reportResult?.buyerAnalysis} 
                isLoading={pipelineStatus === 'running' && activeStep < 4} 
              />
              <ProfitCalculatorCard 
                data={reportResult?.profitAnalysis} 
                isLoading={pipelineStatus === 'running' && activeStep < 5} 
              />
            </div>

            {/* Final recommendation centered full width card */}
            <FinalRecommendationCard 
              recommendation={reportResult?.finalRecommendation} 
              isLoading={pipelineStatus === 'running' && activeStep < 5} 
            />

          </div>

        </div>

        {/* History Drawer Section */}
        <div className="space-y-4 pt-4 border-t border-slate-900/60">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-emerald-400" />
            {t('commandCenterHistory')}
          </h3>

          {history.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-500 text-xs italic">
              {t('commandCenterHistoryEmpty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((h) => (
                <div
                  key={h._id}
                  onClick={() => loadSavedReport(h)}
                  className={`glass-panel p-4 flex justify-between items-center hover:scale-[1.02] transform transition-all cursor-pointer border-l-4 ${
                    reportResult && reportResult._id === h._id ? 'border-l-emerald-500 bg-emerald-950/10' : 'border-l-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 text-xs font-bold">
                    <p className="text-slate-200">{h.cropName} - {h.diseaseAnalysis.diseaseName}</p>
                    <div className="flex gap-3 text-[10px] text-slate-500 font-bold">
                      <span>Qty: {h.profitAnalysis.targetQuantity} kg</span>
                      <span className="text-emerald-400">Net: ₹{h.profitAnalysis.expectedProfit?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSavedReport(h._id, e)}
                    className="p-2 rounded bg-red-950/10 border border-red-950/30 text-red-400 hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Base64 simulated crop leaf images for instant testing
const MOCK_BASE64_SAMPLES = {
  wheat_rust: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  tomato_blight: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  healthy_spinach: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};

export default AICommandCenter;
