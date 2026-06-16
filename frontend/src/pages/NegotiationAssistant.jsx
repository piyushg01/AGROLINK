import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, Hammer, DollarSign, Scale, Percent, 
  TrendingUp, ShieldAlert, Sparkles, Trash2, Calendar, 
  CheckCircle, HelpCircle, LogOut, ChevronRight
} from 'lucide-react';

const NegotiationAssistant = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Standard market averages for autofill
  const marketAverages = {
    'Wheat': 22.0,
    'Rice': 65.0,
    'Tomato': 18.0,
    'Potato': 15.0,
    'Cotton': 60.0,
    'Soybean': 42.0
  };

  // Form states
  const [cropName, setCropName] = useState('Wheat');
  const [dealerOfferedPrice, setDealerOfferedPrice] = useState('');
  const [marketPrice, setMarketPrice] = useState(22.0);
  const [quantity, setQuantity] = useState(1000);
  const [location, setLocation] = useState('Maharashtra');

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Available metadata lists
  const crops = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Cotton', 'Soybean'];
  const locations = ['Maharashtra', 'Punjab', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh'];

  // Update market price autofill when crop changes
  useEffect(() => {
    if (marketAverages[cropName]) {
      setMarketPrice(marketAverages[cropName]);
    }
  }, [cropName]);

  useEffect(() => {
    fetchAnalysisHistory();
  }, [token]);

  // Load calculation history from backend
  const fetchAnalysisHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/negotiation-assistant/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(data.history);
      }
    } catch (err) {
      console.error('Error fetching analysis history:', err);
    }
  };

  // Trigger AI audit analysis request
  const handleAnalyzeOffer = async (e) => {
    e.preventDefault();
    if (!dealerOfferedPrice || !marketPrice || quantity <= 0) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/negotiation-assistant/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropName,
          dealerOfferedPrice: parseFloat(dealerOfferedPrice),
          marketPrice: parseFloat(marketPrice),
          quantity: parseInt(quantity),
          location
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAnalysisResult(data);
      } else {
        setError(data.message || 'Failed to analyze negotiation.');
        triggerLocalFallback();
      }
    } catch (err) {
      console.warn('Backend offline. Triggering offline negotiation audit...', err);
      triggerLocalFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Local calculation engine in case backend goes offline
  const triggerLocalFallback = () => {
    setTimeout(() => {
      const offered = parseFloat(dealerOfferedPrice);
      const market = parseFloat(marketPrice);
      const qty = parseFloat(quantity);

      const diffPct = Math.round(((offered - market) / market) * 100 * 100) / 100;
      const expectedProfit = roundVal(offered * qty, 2);
      const profitDifference = roundVal((offered - market) * qty, 2);

      let recommendation = 'Accept Offer';
      let riskLevel = 'Low';
      let reason = `Offer is fair and aligns with the market rate (currently ${diffPct}% of market rate).`;

      if (diffPct < -10.0) {
        recommendation = 'Reject Offer';
        riskLevel = 'High';
        reason = `Offer is ${Math.abs(diffPct)}% below market value. Accepting this deal will result in a loss of ₹${Math.abs(profitDifference).toLocaleString()} compared to standard market rate.`;
      } else if (diffPct < -2.0) {
        recommendation = 'Negotiate Offer';
        riskLevel = 'Medium';
        reason = `Offer is slightly below market value by ${Math.abs(diffPct)}%. We suggest proposing a counter-offer closer to market average.`;
      }

      const fairnessScore = Math.max(0, Math.min(100, Math.round(100 + (diffPct * 2))));
      const volumeBonus = qty >= 2000 ? 15 : (qty >= 1000 ? 10 : 0);
      const negotiationScore = Math.max(10, Math.min(95, Math.round(50 - diffPct + volumeBonus)));

      const suggestedCounter = diffPct < 0 ? roundVal(market * 0.98, 2) : offered;

      setAnalysisResult({
        success: true,
        cropName,
        location,
        quantity: qty,
        dealerOfferedPrice: offered,
        marketPrice: market,
        differencePct: diffPct,
        expectedProfit,
        profitDifference,
        riskLevel,
        fairnessScore,
        negotiationScore,
        suggestedCounterOffer: suggestedCounter,
        recommendation,
        reason
      });
      setIsLoading(false);
    }, 800);
  };

  const roundVal = (val, dec) => Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);

  // Save audit data to MongoDB
  const handleSaveAnalysis = async () => {
    if (!analysisResult || !token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/negotiation-assistant/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analysisResult)
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        fetchAnalysisHistory();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving negotiation analysis:', err);
    }
  };

  // Delete saved record from MongoDB
  const handleDeleteHistory = async (id) => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/negotiation-assistant/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error('Error deleting analysis record:', err);
    }
  };

  // Helper values for score ring calculations
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-screen pb-16 bg-[#050B07]">
      {/* Navbar Header */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/chat" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Hammer className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/chat" className="text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800/40 p-1 rounded-lg border border-slate-700">
            {['en', 'hi', 'mr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-lg bg-red-950/20 border border-red-900/40 hover:bg-red-900/40 text-red-400 transition-all cursor-pointer"
            title={t('navLogout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/10 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Scale className="w-7 h-7 text-emerald-400" />
              {t('negotiationAssistantTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xl font-medium leading-relaxed">
              {t('negotiationAssistantDesc')}
            </p>
          </div>
          <Link 
            to="/chat"
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Negotiations
          </Link>
        </div>

        {/* Input Form and Result Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inputs Section */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-6">
            <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-3">
              <Percent className="w-4.5 h-4.5" />
              Deal Parameters
            </h3>

            <form onSubmit={handleAnalyzeOffer} className="space-y-4">
              {/* Crop Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">{t('negSelectCrop')}</label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                >
                  {crops.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">{t('negLocation')}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">{t('negQuantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  placeholder="e.g., 1000"
                  required
                />
              </div>

              {/* Market Price (with helper tag) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-400 block">{t('negMarketPrice')}</label>
                  <span className="text-[9px] text-slate-500 font-semibold">Average: ₹{marketAverages[cropName]}/kg</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(parseFloat(e.target.value) || '')}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs pl-7 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g., 22.0"
                    required
                  />
                </div>
              </div>

              {/* Dealer Offered Price */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">{t('negOfferedPrice')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={dealerOfferedPrice}
                    onChange={(e) => setDealerOfferedPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs pl-7 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g., 18.0"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !dealerOfferedPrice || !marketPrice || !quantity}
                className="w-full py-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-350 text-white font-extrabold text-xs transition-all shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running Negotiation Audit...
                  </>
                ) : (
                  <>
                    <Hammer className="w-4 h-4" />
                    {t('negSubmitBtn')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Analysis Dashboard Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {analysisResult ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Recommendation Banner */}
                <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  analysisResult.recommendation === 'Accept Offer' 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-450' 
                    : analysisResult.recommendation === 'Negotiate Offer'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-450'
                    : 'bg-red-950/20 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 flex-shrink-0 mt-0.5">
                      {analysisResult.recommendation === 'Accept Offer' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-60">AI Recommendation</span>
                      <h4 className="font-black text-base mt-0.5 leading-none">
                        {analysisResult.recommendation.toUpperCase()}
                      </h4>
                      <p className="text-[11px] font-semibold mt-2.5 leading-relaxed text-slate-300">
                        {analysisResult.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end gap-2 flex-shrink-0">
                    <button
                      onClick={handleSaveAnalysis}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('negSaveAnalysis')}
                    </button>
                    {saveSuccess && (
                      <span className="text-[9px] text-emerald-400 font-bold block text-center animate-pulse">✓ Saved to History</span>
                    )}
                  </div>
                </div>

                {/* Offer Comparison Side-By-Side & Counters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Comparisons */}
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        Offer vs Market Comparison
                      </h4>
                      
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Dealer Valuation:</span>
                          <span className="text-white font-bold">₹{analysisResult.dealerOfferedPrice}/kg (Total: ₹{analysisResult.expectedProfit.toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Market Valuation:</span>
                          <span className="text-slate-500 font-semibold">₹{analysisResult.marketPrice}/kg (Total: ₹{(analysisResult.marketPrice * analysisResult.quantity).toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 font-bold">
                          <span>{t('negDifference')}:</span>
                          <span className={analysisResult.differencePct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {analysisResult.differencePct >= 0 ? '+' : ''}{analysisResult.differencePct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 font-bold">
                          <span>{t('negProfitDiff')}:</span>
                          <span className={analysisResult.profitDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            ₹{analysisResult.profitDifference.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">{t('negRiskLevel')}</span>
                        <span className={`text-sm font-black uppercase tracking-wide mt-1 block ${
                          analysisResult.riskLevel === 'High' ? 'text-red-400' : analysisResult.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-400'
                        }`}>
                          {analysisResult.riskLevel}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">Gross Revenue</span>
                        <span className="text-md font-black text-white mt-1 block">₹{analysisResult.expectedProfit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leverage Dials & Suggested Counter */}
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Leverage & Counter Offer
                    </h4>

                    {/* Dials Row */}
                    <div className="flex justify-around items-center py-1">
                      {/* Fairness Dial */}
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="relative w-18 h-18">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                            {/* Background Circle */}
                            <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
                            {/* Progress Circle */}
                            <circle 
                              cx="40" 
                              cy="40" 
                              r={radius} 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="6" 
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (analysisResult.fairnessScore / 100) * circumference}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xs">
                            {analysisResult.fairnessScore}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('negFairnessScore')}</span>
                      </div>

                      {/* Negotiation Leverage Dial */}
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="relative w-18 h-18">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
                            <circle 
                              cx="40" 
                              cy="40" 
                              r={radius} 
                              fill="none" 
                              stroke="#a855f7" 
                              strokeWidth="6" 
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (analysisResult.negotiationScore / 100) * circumference}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xs">
                            {analysisResult.negotiationScore}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('negNegotiationScore')}</span>
                      </div>
                    </div>

                    {/* Counter Offer Card */}
                    <div className="bg-[#5b21b6]/10 p-3.5 rounded-xl border border-purple-500/20 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-purple-400">{t('negCounterOffer')}:</span>
                        <span className="text-white text-base font-black">₹{analysisResult.suggestedCounterOffer}/kg</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>Total Counter Value:</span>
                        <span>₹{(analysisResult.suggestedCounterOffer * analysisResult.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full bg-slate-950/20 border border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4 py-28">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
                  <Scale className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Enter parameters to audit dealer offers</h3>
                  <p className="text-xs text-slate-500 max-w-[280px] mt-1 mx-auto leading-relaxed">
                    Compare offered rates with local averages to calculate fairness metrics, net profit gaps, and counter rates.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Saved Audits History */}
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-3">
            <Calendar className="w-4.5 h-4.5 text-emerald-400" />
            {t('negAnalysisHistory')}
          </h3>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center font-bold py-6">{t('negHistoryEmpty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyList.map((item) => (
                <div 
                  key={item._id} 
                  className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/20 transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteHistory(item._id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                    title="Delete Audit Snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    {/* Header Info */}
                    <div className="flex items-center gap-1.5">
                      <Hammer className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white">{item.cropName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">• {item.location}</span>
                    </div>
                    
                    {/* Date info */}
                    <span className="text-[8px] text-slate-500 font-semibold mt-0.5 block">
                      Audited on: {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {/* Stats layout */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[9px] text-slate-400 font-semibold">
                      <div>
                        <span>Offer / Market</span>
                        <span className="text-white block font-bold mt-0.5">₹{item.dealerOfferedPrice} / ₹{item.marketPrice}</span>
                      </div>
                      <div>
                        <span>Volume Weight</span>
                        <span className="text-white block font-bold mt-0.5">{item.quantity} kg</span>
                      </div>
                      <div>
                        <span>Net Valuation</span>
                        <span className={`block font-bold mt-0.5 ${item.profitDifference >= 0 ? 'text-emerald-400' : 'text-red-450'}`}>
                          ₹{item.profitDifference.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block font-semibold">Counter Target</span>
                      <span className="text-white font-extrabold">₹{item.suggestedCounterOffer}/kg</span>
                    </div>

                    {/* Recommendation action badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                      item.recommendation === 'Accept Offer'
                        ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                        : item.recommendation === 'Negotiate Offer'
                        ? 'bg-amber-500/10 text-amber-505 border border-amber-500/20'
                        : 'bg-red-550/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.recommendation === 'Accept Offer' ? 'Accept' : item.recommendation === 'Negotiate Offer' ? 'Negotiate' : 'Reject'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NegotiationAssistant;
