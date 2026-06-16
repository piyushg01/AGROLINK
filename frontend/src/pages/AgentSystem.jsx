import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import {
  Bot, UploadCloud, BrainCircuit, Activity, BarChart3,
  Layers, ChevronRight, ShieldAlert, Sparkles, CheckSquare, ShoppingBag,
  Scale, Users, Leaf, CloudSun, MapPin, Truck, Calendar, Trash2,
  Printer, Compass, ArrowRight, CheckCircle, Clock
} from 'lucide-react';

const AgentSystem = () => {
  const { t } = useLanguage();
  const voice = useVoiceAssistant();

  // Inputs
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(1000);

  // Execution states
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // idle, running, completed, failed
  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0); // 0: none, 1: disease, 2: market, 3: buyer, 4: logistics, 5: report
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [history, setHistory] = useState([]);

  const selectedDealer = workflowResult?.agents?.buyer?.result?.matches?.[0] || {};

  // Refs for auto-scrolling
  const terminalEndRef = useRef(null);

  // Fetch history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const fetchHistory = async () => {
    const token = localStorage.getItem('agrolink_token');
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/agent-workflow/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch agent history:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedPreset(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setCropImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Curated Leaf Presets
  const applyPreset = async (presetType) => {
    setSelectedPreset(presetType);
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

  // Run the multi-agent orchestration
  const triggerWorkflow = async () => {
    if (!cropImage) {
      alert('Please upload a leaf photo or pick a sample preset to run the agents.');
      return;
    }

    setWorkflowStatus('running');
    setWorkflowResult(null);
    setCurrentProgress(5);
    setActiveStep(1);
    setTerminalLogs([]);

    // Custom logs simulation during execution for real-time fidelity
    const addLogWithDelay = (message, delay) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setTerminalLogs(prev => [...prev, message]);
          resolve();
        }, delay);
      });
    };

    // Simulated visual pipeline timing
    await addLogWithDelay('[Orchestrator] Multi-Agent Pipeline started.', 200);
    await addLogWithDelay('[Disease Agent] Booting leaf pathology diagnostic classifier...', 400);
    await addLogWithDelay('[Disease Agent] Scanning image texture details...', 700);

    const token = localStorage.getItem('agrolink_token');
    try {
      // API call to run the backend agents
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/agent-workflow/run`, {
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
        setWorkflowStatus('failed');
        setTerminalLogs(prev => [...prev, `[Orchestrator] ERROR: Pipeline failed - ${data.error}`]);
        return;
      }

      const run = data.workflow;

      // Play through the sequential visualization nicely
      setCurrentProgress(25);
      setActiveStep(1);
      if (run.agents.disease.logs.length > 0) {
        for (const log of run.agents.disease.logs) {
          await addLogWithDelay(log, 500);
        }
      }
      
      setCurrentProgress(50);
      setActiveStep(2);
      await addLogWithDelay('[Market Agent] Running forecasting linear regressions...', 400);
      if (run.agents.market.logs.length > 0) {
        for (const log of run.agents.market.logs) {
          await addLogWithDelay(log, 500);
        }
      }

      setCurrentProgress(75);
      setActiveStep(3);
      await addLogWithDelay('[Buyer Agent] Computing trust scores and geolocation indexing...', 400);
      if (run.agents.buyer.logs.length > 0) {
        for (const log of run.agents.buyer.logs) {
          await addLogWithDelay(log, 500);
        }
      }

      setCurrentProgress(90);
      setActiveStep(4);
      await addLogWithDelay('[Logistics Agent] Fetching carrier freight schedules...', 400);
      if (run.agents.logistics.logs.length > 0) {
        for (const log of run.agents.logistics.logs) {
          await addLogWithDelay(log, 500);
        }
      }

      setCurrentProgress(100);
      setActiveStep(5);
      await addLogWithDelay('[Orchestrator] Synthesizing final unified agri-commerce dossier...', 400);
      await addLogWithDelay('[Orchestrator] Pipeline executed successfully! Displaying report.', 300);

      setWorkflowStatus('completed');
      setWorkflowResult(run);
      voice.speakText(`AI agents successfully processed your crop. Matched with ${run.agents.buyer.result.matches[0].name} for net earnings of rupees ${Math.round(run.agents.buyer.result.matches[0].offeredPrice * run.targetQuantity - run.agents.logistics.result.estimatedCost)}.`, 'en');
      fetchHistory();

    } catch (err) {
      console.error('Workflow API error:', err);
      setWorkflowStatus('failed');
      setTerminalLogs(prev => [...prev, '[Orchestrator] CRITICAL ERROR: Connection to server lost. Pipeline halted.']);
    }
  };

  const loadWorkflowRun = (run) => {
    setWorkflowStatus('completed');
    setWorkflowResult(run);
    setCurrentProgress(100);
    setActiveStep(5);
    setImagePreview(run.cropImage);
    setTargetQuantity(run.targetQuantity);
    setTerminalLogs([
      '[Orchestrator] Loaded historical multi-agent execution record.',
      `[Disease Agent] Diagnosed ${run.agents.disease.result.disease}`,
      `[Market Agent] Recommendation: ${run.agents.market.result.recommendation.action}`,
      `[Buyer Agent] Dealer: ${run.agents.buyer.result.matches[0].name}`,
      `[Logistics Agent] Carrier: ${run.agents.logistics.result.transportPartner}`
    ]);
  };

  const deleteWorkflowRun = async (id, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('agrolink_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/agent-workflow/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchHistory();
        if (workflowResult && workflowResult._id === id) {
          setWorkflowResult(null);
          setWorkflowStatus('idle');
          setImagePreview('');
          setCropImage(null);
          setSelectedPreset(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete workflow run:', err);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Navbar */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="text-emerald-400 hover:text-emerald-300">{t('navAiHub')}</Link>
          <Link to="/crop-health" className="hover:text-emerald-400 transition-colors">{t('navCropHealth')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>
      </nav>

      {/* Main Grid container */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload Scanner + Control Terminal */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Header Card */}
          <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-md font-bold text-white uppercase tracking-wider">{t('agentSystemTitle')}</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded tracking-wide mt-1 block w-fit">4 AI Agents</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-3">{t('agentSystemDesc')}</p>
          </div>

          {/* Upload Scanner Box */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Crop Leaf Upload</h3>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            <div className="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-3 relative hover:border-emerald-500/50 transition-colors bg-slate-950/20 min-h-[160px]">
              <UploadCloud className="w-10 h-10 text-emerald-400 animate-bounce" />
              <div className="text-[10px]">
                <p className="font-bold text-slate-200">Drag or click to choose leaf image</p>
                <p className="text-slate-500 mt-0.5">Base64 PNG, JPG up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {imagePreview && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-800">
                <img src={imagePreview} alt="Leaf upload preview" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Fast Presets</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyPreset('wheat_rust')}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    selectedPreset === 'wheat_rust' ? 'bg-amber-950/40 border-amber-500 text-amber-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🌾 Wheat Rust
                </button>
                <button
                  onClick={() => applyPreset('tomato_blight')}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    selectedPreset === 'tomato_blight' ? 'bg-red-950/40 border-red-500 text-red-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🍅 Tomato Blight
                </button>
                <button
                  onClick={() => applyPreset('healthy_spinach')}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    selectedPreset === 'healthy_spinach' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  🥬 Healthy Leaf
                </button>
              </div>
            </div>

            {/* Target Quantity Slider */}
            <div className="space-y-2 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">Target Crop Volume:</span>
                <span className="text-emerald-400 font-extrabold">{targetQuantity.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={targetQuantity}
                disabled={workflowStatus === 'running'}
                onChange={(e) => setTargetQuantity(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={triggerWorkflow}
              disabled={workflowStatus === 'running'}
              className="w-full btn-primary py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
            >
              {workflowStatus === 'running' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('agentRunning')}
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 text-white" />
                  {t('agentRunBtn')}
                </>
              )}
            </button>
          </div>

          {/* Terminal Console Logs box */}
          <div className="glass-panel p-5 bg-[#030804] border border-emerald-950/50 space-y-3">
            <span className="text-[10px] text-emerald-400 font-black tracking-wider uppercase block">{t('agentConsoleLogs')}</span>
            <div className="h-48 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-2 select-text scrollbar-thin">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic">Console feed idle. Boot pipeline to stream log events...</div>
              ) : (
                terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-emerald-600 mr-1.5">$</span>
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef}></div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Orchestration Dash */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Progress bar and Checkboxes */}
          {workflowStatus !== 'idle' && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>{t('workflowProgress')}</span>
                <span className="text-emerald-400 font-black">{currentProgress}%</span>
              </div>
              
              {/* Glow progress bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>

              {/* Steps Checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[
                  { step: 1, label: 'Disease Detection', desc: 'Agent 1' },
                  { step: 2, label: 'Price Forecasting', desc: 'Agent 2' },
                  { step: 3, label: 'Buyer Matchmaker', desc: 'Agent 3' },
                  { step: 4, label: 'Dispatch Logistics', desc: 'Agent 4' },
                ].map((s) => {
                  const isActive = activeStep === s.step;
                  const isDone = activeStep > s.step || workflowStatus === 'completed';
                  return (
                    <div 
                      key={s.step} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/5 scale-105' 
                          : isDone 
                          ? 'bg-slate-900/40 border-emerald-900/40 opacity-80'
                          : 'bg-slate-900/10 border-slate-900 opacity-40'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : isActive ? (
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-800 flex-shrink-0 bg-slate-950"></div>
                      )}
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold leading-none">{s.desc}</p>
                        <p className="text-[10px] text-slate-200 font-black mt-1 leading-none">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results grid */}
          {workflowResult && (
            <div className="space-y-6">
              
              {/* Agent Outputs Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Agent 1: Disease Pathology */}
                <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                    Agent 1 Response
                  </div>

                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Leaf className="w-4.5 h-4.5 text-emerald-400" />
                    {t('diseaseAgentLabel')}
                  </h3>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3 mt-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-slate-100">{workflowResult.agents.disease.result.disease}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Crop: {workflowResult.agents.disease.result.crop}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        workflowResult.agents.disease.result.severity === 'High' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : workflowResult.agents.disease.result.severity === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        Severity: {workflowResult.agents.disease.result.severity}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-relaxed italic">
                      {workflowResult.agents.disease.result.description}
                    </p>

                    <div className="border-t border-slate-800/60 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 font-bold block">Treatment Cures:</span>
                        <span className="text-slate-300 leading-normal">{workflowResult.agents.disease.result.treatment[0]}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block">Est. Cost:</span>
                        <span className="text-emerald-400 font-black">{workflowResult.agents.disease.result.estimatedCost}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent 2: Market Intelligence */}
                <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                    Agent 2 Response
                  </div>

                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
                    {t('marketAgentLabel')}
                  </h3>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3 mt-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-black text-white">₹{workflowResult.agents.market.result.currentPrice}/kg</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Average Market Price</p>
                      </div>
                      <span className={`px-2 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                        workflowResult.agents.market.result.recommendation.action === 'Sell'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/35'
                          : workflowResult.agents.market.result.recommendation.action === 'Hold'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {workflowResult.agents.market.result.recommendation.action}
                      </span>
                    </div>

                    {/* Custom inline mini SVG trend line */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] text-slate-500 font-bold block">15-Month Forecast Fitting Trend:</span>
                      <div className="h-10 bg-slate-950/40 rounded border border-slate-800/80 p-1 relative">
                        <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                          {/* Grid line */}
                          <line x1="0" y1="10" x2="100" y2="10" stroke="#1c2d22" strokeWidth="0.5" strokeDasharray="2" />
                          {/* Smooth curved trend line */}
                          <path 
                            d="M 0 16 Q 25 18 50 12 T 100 4" 
                            fill="none" 
                            stroke={workflowResult.agents.market.result.priceTrend === 'Upward' ? '#10b981' : '#f43f5e'} 
                            strokeWidth="1.5" 
                          />
                        </svg>
                        <span className="absolute bottom-1 right-2 text-[7px] text-slate-500 uppercase font-black tracking-wider">Ridge Fit</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/50 mt-1">
                      {workflowResult.agents.market.result.recommendation.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Outputs Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Agent 3: Buyer Matchmaker */}
                <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                    Agent 3 Response
                  </div>

                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-emerald-400" />
                    {t('buyerAgentLabel')}
                  </h3>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3 mt-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-100">{selectedDealer.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Scored dealer recommendation</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">₹{selectedDealer.offeredPrice}/kg</span>
                        <span className="text-[8px] text-slate-500 block">Bid Offer</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[9px] bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/50">
                      <div>
                        <span className="text-slate-500 block font-bold">Trust Index</span>
                        <span className="text-slate-200 font-extrabold">{selectedDealer.trustScore}%</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-slate-500 block font-bold">Rating</span>
                        <span className="text-slate-200 font-extrabold">★ {selectedDealer.rating}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-bold">Transactions</span>
                        <span className="text-slate-200 font-extrabold">{selectedDealer.previousTransactions} deals</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span>Match Score Leverage:</span>
                      <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 rounded-md">{selectedDealer.matchScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Agent 4: Dispatch Logistics */}
                <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                    Agent 4 Response
                  </div>

                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4.5 h-4.5 text-emerald-400" />
                    {t('logisticsAgentLabel')}
                  </h3>

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3 mt-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-100">{workflowResult.agents.logistics.result.transportPartner}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Vehicle: {workflowResult.agents.logistics.result.vehicle}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">₹{workflowResult.agents.logistics.result.estimatedCost}</span>
                        <span className="text-[8px] text-slate-500 block">Freight Tariffs</span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-[10px] bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/50">
                      <div>
                        <span className="text-slate-500 font-bold">Distance:</span>
                        <span className="text-slate-200 font-extrabold block">{selectedDealer.distanceKm} km</span>
                      </div>
                      <div className="border-l border-slate-800 pl-4">
                        <span className="text-slate-500 font-bold">Transit Time:</span>
                        <span className="text-slate-200 font-extrabold block">{workflowResult.agents.logistics.result.travelHours} Hours</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 leading-normal italic">
                      Route: {workflowResult.agents.logistics.result.routeDetails}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Map Routing Visualizer */}
              <div className="glass-panel p-6 space-y-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Compass className="w-4.5 h-4.5 text-emerald-400" />
                  {t('logisticsMapLabel')}
                </span>

                <div className="h-44 bg-slate-950/50 rounded-2xl border border-slate-850 p-4 relative overflow-hidden flex flex-col justify-between">
                  {/* Grid layout */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-5 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border border-slate-300"></div>
                    ))}
                  </div>

                  {/* SVG Map Path Drawing */}
                  <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Dashed line optimized route */}
                    <path 
                      id="transit-route"
                      d="M 10 20 Q 35 5, 55 35 T 90 20" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="1" 
                      strokeDasharray="2" 
                      className="animate-dash"
                    />
                    
                    {/* Glowing dots */}
                    <circle cx="10" cy="20" r="2" fill="#34d399" className="animate-ping" />
                    <circle cx="10" cy="20" r="1.5" fill="#10b981" />

                    <circle cx="90" cy="20" r="2" fill="#fbbf24" className="animate-ping" />
                    <circle cx="90" cy="20" r="1.5" fill="#f59e0b" />
                  </svg>

                  {/* Overlaid location flags */}
                  <div className="flex justify-between items-start z-10 text-[9px] font-black uppercase text-slate-400 mt-2">
                    <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Rajesh Farms (Pune)</span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{selectedDealer.name}</span>
                    </div>
                  </div>

                  {/* Map details overlays */}
                  <div className="flex justify-between items-end z-10 text-[9px] font-bold text-slate-500 mb-1">
                    <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dispatch Status: <span className="text-emerald-400 font-extrabold uppercase">Ready</span></span>
                    </div>
                    
                    <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 flex flex-col items-end">
                      <span className="text-[8px] text-slate-500 uppercase">Distance Timeline</span>
                      <span className="text-slate-200 font-black mt-0.5">{selectedDealer.distanceKm} km ({workflowResult.agents.logistics.result.travelHours} hrs)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printable Consolidated Report Sheet */}
              <div id="print-area" className="glass-panel p-8 space-y-6 bg-[#0c140f]/60 border border-emerald-900/20 print:bg-white print:text-black print:border-none print:shadow-none select-text">
                <div className="flex justify-between items-center border-b border-emerald-500/10 pb-4 print:border-black">
                  <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-emerald-400 print:text-emerald-600" />
                    <h2 className="text-md font-black text-white uppercase tracking-wider print:text-black">
                      {t('finalReportTitle')}
                    </h2>
                  </div>
                  
                  <div className="text-right text-[10px] text-slate-400 print:text-black">
                    <p>Report Ref: RUN-{workflowResult._id.slice(-6).toUpperCase()}</p>
                    <p className="mt-0.5">Date: {new Date(workflowResult.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Description summary block */}
                <p className="text-[11px] leading-relaxed text-slate-300 italic border-l-2 border-l-emerald-500 pl-4 print:text-black print:border-l-black print:italic">
                  {workflowResult.finalReport.split('\n').find(line => line.includes('###')) ? 
                   `AGRO-LINK Unified Multi-Agent Dossier for ${workflowResult.targetQuantity} kg of ${workflowResult.agents.disease.result.crop}. Leaf diagnosed with ${workflowResult.agents.disease.result.disease} (${workflowResult.agents.disease.result.severity} severity). Secure buyer offer: ₹${selectedDealer.offeredPrice}/kg with ${selectedDealer.name}. Logistics scheduled carrier: ${workflowResult.agents.logistics.result.transportPartner}.` : 
                   workflowResult.finalReport}
                </p>

                {/* Structured Financial Breakdown Grid */}
                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800/50 print:border-black">
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-black">
                    <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">{t('grossEarningsLabel')}</span>
                    <span className="text-lg font-black text-slate-100 print:text-black mt-1 block">
                      ₹{(selectedDealer.offeredPrice * workflowResult.targetQuantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-black">
                    <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">{t('freightCostLabel')}</span>
                    <span className="text-lg font-black text-red-400 print:text-red-600 mt-1 block">
                      -₹{workflowResult.agents.logistics.result.estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-emerald-950/25 p-4 rounded-xl border border-emerald-500/20 print:bg-emerald-100 print:border-emerald-300 print:text-black">
                    <span className="text-[9px] text-emerald-400 print:text-emerald-700 uppercase font-black block tracking-wider">{t('netEarningsLabel')}</span>
                    <span className="text-xl font-black text-emerald-400 print:text-emerald-700 mt-1 block">
                      ₹{(selectedDealer.offeredPrice * workflowResult.targetQuantity - workflowResult.agents.logistics.result.estimatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Curative Recipe recommendations */}
                <div className="bg-slate-900/25 p-4 rounded-xl border border-slate-850 space-y-2 text-[10px] text-slate-300 print:bg-slate-50 print:text-black print:border-slate-200">
                  <span className="font-bold text-slate-200 block">Pathology Cure Guidelines:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {workflowResult.agents.disease.result.treatment.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Print action button */}
                <div className="flex justify-end pt-4 print:hidden">
                  <button
                    onClick={triggerPrint}
                    className="px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    Print Dossier Sheet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state / Multi-Agent Explanatory Infographic */}
          {!workflowResult && workflowStatus === 'idle' && (
            <div className="glass-panel p-8 space-y-6 border-l-4 border-l-emerald-500 bg-gradient-to-tr from-emerald-950/10 to-slate-900/40 animate-fade-in">
              <div className="space-y-2 border-b border-emerald-500/10 pb-4">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-6 h-6 text-emerald-400" />
                  {t('agentWorkflowGuideTitle')}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('agentWorkflowGuideDesc')}
                </p>
              </div>

              {/* Step list with animated connecting lines */}
              <div className="space-y-6 relative pl-4">
                {/* Connecting track line */}
                <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500/30 via-blue-500/30 to-purple-500/30"></div>

                {/* Step 1 */}
                <div className="flex gap-4 relative items-start hover:scale-[1.01] transform transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-400 z-10 shrink-0 shadow-md shadow-emerald-500/10">
                    1
                  </div>
                  <div className="space-y-1 bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60 flex-1 hover:border-emerald-500/20 transition-colors">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Leaf className="w-4 h-4 text-emerald-400" />
                      {t('agent1GuideTitle')}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {t('agent1GuideDesc')}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 relative items-start hover:scale-[1.01] transform transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-500 flex items-center justify-center text-xs font-bold text-blue-400 z-10 shrink-0 shadow-md shadow-blue-500/10">
                    2
                  </div>
                  <div className="space-y-1 bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60 flex-1 hover:border-blue-500/20 transition-colors">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      {t('agent2GuideTitle')}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {t('agent2GuideDesc')}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 relative items-start hover:scale-[1.01] transform transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500 flex items-center justify-center text-xs font-bold text-purple-400 z-10 shrink-0 shadow-md shadow-purple-500/10">
                    3
                  </div>
                  <div className="space-y-1 bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60 flex-1 hover:border-purple-500/20 transition-colors">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      {t('agent3GuideTitle')}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {t('agent3GuideDesc')}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 relative items-start hover:scale-[1.01] transform transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-500 flex items-center justify-center text-xs font-bold text-amber-400 z-10 shrink-0 shadow-md shadow-amber-500/10">
                    4
                  </div>
                  <div className="space-y-1 bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60 flex-1 hover:border-amber-500/20 transition-colors">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-400" />
                      {t('agent4GuideTitle')}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      {t('agent4GuideDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-2xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" />
                <p className="text-[10.5px] text-slate-300 leading-normal">
                  <strong>Get Started:</strong> Select a leaf disease preset on the left panel (like Wheat Rust or Tomato Blight), enter a target harvest volume, and click <strong>"Trigger Agents Pipeline"</strong> to watch the AI Agents work.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* History Sidebar/Drawer log bottom list */}
      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          {t('workflowHistory')}
        </h3>

        {history.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-xs italic">
            No previous multi-agent pipelines executed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((run) => {
              const selectedD = run.agents.buyer.result?.matches[0] || {};
              const logisticsC = run.agents.logistics.result?.estimatedCost || 0;
              const earnings = (selectedD.offeredPrice * run.targetQuantity) - logisticsC;
              
              return (
                <div
                  key={run._id}
                  onClick={() => loadWorkflowRun(run)}
                  className={`glass-panel p-4 flex justify-between items-center hover:scale-[1.02] transition-all transform cursor-pointer border-l-4 ${
                    workflowResult && workflowResult._id === run._id ? 'border-l-emerald-500 bg-emerald-950/10' : 'border-l-slate-600 hover:border-l-emerald-500/50'
                  }`}
                >
                  <div className="space-y-1.5 text-xs font-semibold">
                    <p className="text-slate-200 font-bold leading-none">{run.agents.disease.result?.crop} - {run.agents.disease.result?.disease}</p>
                    <p className="text-[10px] text-slate-500 leading-none">Date: {new Date(run.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-2 text-[10px] mt-2">
                      <span className="text-slate-400">Qty: {run.targetQuantity} kg</span>
                      <span className="text-emerald-400 font-bold">Net: ₹{earnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteWorkflowRun(run._id, e)}
                    className="p-2.5 rounded-lg bg-red-950/10 hover:bg-red-950/30 border border-red-950/30 hover:border-red-900/50 text-red-400 transition-colors cursor-pointer"
                    title="Delete workflow run log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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

export default AgentSystem;
