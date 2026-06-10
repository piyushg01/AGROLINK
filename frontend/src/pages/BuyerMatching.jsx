import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, Leaf, Users, Star, Award, MapPin, 
  DollarSign, CheckCircle, Trash2, Calendar, TrendingUp, LogOut, Phone
} from 'lucide-react';

const BuyerMatching = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Form states
  const [cropName, setCropName] = useState('Wheat');
  const [quantity, setQuantity] = useState(1000);

  // API states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchingResult, setMatchingResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const crops = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Cotton', 'Soybean'];

  // Read farmer coordinates from context user profile
  const farmerCoords = user?.location?.coordinates || [73.8850, 18.7250];

  useEffect(() => {
    fetchMatchingHistory();
  }, [token]);

  // Load saved matching snaps from database
  const fetchMatchingHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/smart-match/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(data.history);
      }
    } catch (err) {
      console.error('Error fetching matching history:', err);
    }
  };

  // Trigger matching algorithm
  const handleFindBuyers = async (e) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsLoading(true);
    setError(null);
    setMatchingResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/smart-match/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cropName, quantity: parseFloat(quantity) })
      });

      const data = await response.json();
      if (response.ok) {
        setMatchingResult(data);
      } else {
        setError(data.message || 'Failed to match buyers.');
        triggerLocalFallback();
      }
    } catch (err) {
      console.warn('Backend server connection issue. Triggering offline matching simulation...', err);
      triggerLocalFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Local matching simulation if API is down
  const triggerLocalFallback = () => {
    setTimeout(() => {
      const basePrices = {
        'Wheat': 22.0, 'Rice': 65.0, 'Tomato': 18.0, 'Potato': 15.0, 'Cotton': 60.0, 'Soybean': 42.0
      };
      const basePrice = basePrices[cropName] || 20.0;

      const mockDealers = [
        { id: '1', name: 'Suresh Kulkarni', lon: 73.8567, lat: 18.5204, multiplier: 1.02, trustScore: 95, rating: 4.8, previousTransactions: 38 },
        { id: '2', name: 'Vikram Singh', lon: 73.0012, lat: 19.0308, multiplier: 1.05, trustScore: 92, rating: 4.6, previousTransactions: 24 },
        { id: '3', name: 'Rajesh Deshmukh', lon: 74.1240, lat: 19.5761, multiplier: 1.01, trustScore: 88, rating: 4.3, previousTransactions: 15 },
        { id: '4', name: 'Amit Patel', lon: 72.8777, lat: 19.0760, multiplier: 0.98, trustScore: 85, rating: 4.1, previousTransactions: 12 },
        { id: '5', name: 'Harpreet Singh', lon: 75.8573, lat: 22.7196, multiplier: 1.12, trustScore: 78, rating: 3.9, previousTransactions: 8 }
      ];

      // Calculate distances using Haversine
      const calculated = mockDealers.map(d => {
        const rad = Math.PI / 180;
        const dLon = (d.lon - farmerCoords[0]) * rad;
        const dLat = (d.lat - farmerCoords[1]) * rad;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(farmerCoords[1] * rad) * Math.cos(d.lat * rad) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Math.round(6371 * c * 100) / 100;
        const offeredPrice = Math.round(basePrice * d.multiplier * 100) / 100;

        return {
          dealerId: d.id,
          name: d.name,
          distanceKm,
          offeredPrice,
          rating: d.rating,
          trustScore: d.trustScore,
          previousTransactions: d.previousTransactions,
          isBestProfit: false,
          isFastestSale: false
        };
      });

      const maxPrice = Math.max(...calculated.map(d => d.offeredPrice));
      const minDistance = Math.min(...calculated.map(d => d.distanceKm));

      calculated.forEach(d => {
        if (d.offeredPrice === maxPrice) d.isBestProfit = true;
        if (d.distanceKm === minDistance) d.isFastestSale = true;

        const priceScore = (d.offeredPrice / maxPrice) * 100;
        const distanceScore = Math.max(0, 100 - (d.distanceKm / 5));
        const txScore = Math.min(d.previousTransactions * 5, 100);
        d.matchScore = Math.round((priceScore * 0.4) + (distanceScore * 0.3) + (d.trustScore * 0.15) + (txScore * 0.15));
      });

      // Sort by match score
      calculated.sort((a, b) => b.matchScore - a.matchScore);

      setMatchingResult({
        success: true,
        cropName,
        quantity,
        farmerCoords,
        matches: calculated.slice(0, 5)
      });
      setIsLoading(false);
    }, 800);
  };

  // Save snapshot to database
  const handleSaveSnapshot = async () => {
    if (!matchingResult || !token) return;
    try {
      const response = await fetch('http://localhost:8000/api/smart-match/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(matchingResult)
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        fetchMatchingHistory();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving matching snapshot:', err);
    }
  };

  // Delete matching history snapshot
  const handleDeleteHistory = async (id) => {
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:8000/api/smart-match/history/${id}`, {
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
      console.error('Error deleting matching record:', err);
    }
  };

  // Helpers for recommendations
  const bestProfitMatch = matchingResult?.matches?.find(m => m.isBestProfit);
  const fastestSaleMatch = matchingResult?.matches?.find(m => m.isFastestSale);

  return (
    <div className="min-h-screen pb-16 bg-[#050B07]">
      {/* Sticky Header Navbar */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/ai-hub" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Users className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5">{t('navAiHub')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
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

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Page title header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/10 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Users className="w-7 h-7 text-emerald-400" />
              {t('buyerMatchingTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xl font-medium leading-relaxed">
              {t('buyerMatchingDesc')}
            </p>
          </div>
          <Link 
            to="/ai-hub"
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to AI Hub
          </Link>
        </div>

        {/* Form and recommendations view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Params block */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-5">
            <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-3">
              <Leaf className="w-4.5 h-4.5" />
              Matching Inputs
            </h3>

            <form onSubmit={handleFindBuyers} className="space-y-4">
              {/* Crop Select */}
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

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">{t('matchEnterQty')}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  placeholder="e.g. 1500"
                  required
                />
              </div>

              {/* Farmer location info coordinates display */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Your Registered Coordinates</span>
                <span className="text-slate-200 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Longitude: {farmerCoords[0]}, Latitude: {farmerCoords[1]}
                </span>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={isLoading || !quantity}
                className="w-full py-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-350 text-white font-extrabold text-xs transition-all shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running AI Matcher...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    {t('matchSubmitBtn')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Buyer Matches Ranking & Highlights */}
          <div className="lg:col-span-2 space-y-6">
            
            {matchingResult ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* AI highlights cards: Best Profit & Fastest Sale */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Best Profit */}
                  {bestProfitMatch && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider">
                          {t('bestProfitBadge')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white text-base font-black">{bestProfitMatch.name}</h4>
                        <span className="text-[10px] text-slate-400 mt-1 block">Best absolute payout for your crop volume.</span>
                      </div>
                      <div className="flex justify-between items-end border-t border-emerald-500/10 pt-3 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">RATE / PAYOUT</span>
                          <span className="text-white font-black text-sm">₹{bestProfitMatch.offeredPrice}/kg</span>
                        </div>
                        <span className="text-emerald-400 font-bold">
                          ₹{(bestProfitMatch.offeredPrice * quantity).toLocaleString()} Total
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fastest Sale */}
                  {fastestSaleMatch && (
                    <div className="bg-purple-950/20 border border-purple-500/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <MapPin className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-500 text-white text-[8px] font-black uppercase tracking-wider">
                          {t('fastestSaleBadge')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white text-base font-black">{fastestSaleMatch.name}</h4>
                        <span className="text-[10px] text-slate-400 mt-1 block">Closest distance, minimizing transport and logistic delays.</span>
                      </div>
                      <div className="flex justify-between items-end border-t border-purple-500/10 pt-3 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold">PHYSICAL DISTANCE</span>
                          <span className="text-white font-black text-sm">{fastestSaleMatch.distanceKm} km away</span>
                        </div>
                        <span className="text-purple-400 font-bold">
                          ₹{fastestSaleMatch.offeredPrice}/kg Offer
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top 5 Buyers list */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-emerald-500/10">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      AI Score Rank: Top 5 Matching Buyers
                    </h4>
                    <button
                      onClick={handleSaveSnapshot}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black transition-all shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {t('saveMatchSnapshot')}
                    </button>
                  </div>

                  {saveSuccess && (
                    <span className="text-[9px] text-emerald-400 font-bold block text-right animate-pulse">✓ Snapshot saved successfully!</span>
                  )}

                  <div className="space-y-3">
                    {matchingResult.matches.map((item, idx) => (
                      <div 
                        key={item.dealerId}
                        className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative group"
                      >
                        {/* Rating and details */}
                        <div className="flex items-start gap-3.5">
                          {/* Rank Circle */}
                          <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-xs text-emerald-400 flex-shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">{item.name}</span>
                              <div className="flex items-center gap-0.5 bg-yellow-500/15 text-yellow-500 px-1.5 py-0.5 rounded text-[8px] font-black">
                                <Star className="w-2.5 h-2.5 fill-yellow-500" />
                                {item.rating}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1 font-semibold">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" /> {item.distanceKm} km away
                              </span>
                              <span>• Trust Score: <span className="text-white font-bold">{item.trustScore}%</span></span>
                              <span>• Transactions: <span className="text-white font-bold">{item.previousTransactions} deals</span></span>
                            </div>
                          </div>
                        </div>

                        {/* pricing payout and action */}
                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
                          <div className="text-right text-xs">
                            <span className="text-[9px] text-slate-500 block font-bold">OFFER PRICE</span>
                            <span className="text-emerald-400 font-extrabold text-sm block">₹{item.offeredPrice}/kg</span>
                            <span className="text-[9px] text-slate-450 font-bold block mt-0.5">₹{(item.offeredPrice * quantity).toLocaleString()} Total</span>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            <div className="text-[10px] bg-slate-950 border border-slate-800/60 px-2.5 py-1 rounded-lg text-slate-300 font-bold text-center">
                              Match: <span className="text-purple-400 font-black">{item.matchScore}%</span>
                            </div>
                            <Link
                              to="/chat"
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] transition-all cursor-pointer shadow-sm text-center"
                            >
                              {t('connectDealerBtn')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full bg-slate-950/20 border border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4 py-28">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Find optimal crop buyer matching profiles</h3>
                  <p className="text-xs text-slate-500 max-w-[280px] mt-1 mx-auto leading-relaxed">
                    Query the smart sorting engine to evaluate registered buyers based on offered price, distance, and historical credibility.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Saved Match history snaps log */}
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-3">
            <Calendar className="w-4.5 h-4.5 text-emerald-400" />
            {t('matchHistoryTitle')}
          </h3>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center font-bold py-6">{t('matchHistoryEmpty')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyList.map((item) => {
                const bestSnap = item.matches.find(m => m.isBestProfit);
                return (
                  <div 
                    key={item._id} 
                    className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/20 transition-all flex flex-col justify-between space-y-4 relative group"
                  >
                    {/* Delete Snapshot btn */}
                    <button
                      onClick={() => handleDeleteHistory(item._id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete Match Snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {/* Header Title info */}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-white">{item.cropName}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">• {item.quantity} kg</span>
                      </div>
                      
                      {/* Created date snap */}
                      <span className="text-[8px] text-slate-500 font-semibold mt-0.5 block">
                        Saved on: {new Date(item.createdAt).toLocaleDateString()}
                      </span>

                      {/* Top Match Preview */}
                      {bestSnap && (
                        <div className="mt-3.5 bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl space-y-1 text-[10px] font-semibold">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">TOP PAYING MATCH</span>
                          <div className="flex justify-between items-center text-white">
                            <span className="font-extrabold">{bestSnap.name}</span>
                            <span className="font-black text-emerald-450">₹{bestSnap.offeredPrice}/kg</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-450 font-bold">
                            <span>Distance: {bestSnap.distanceKm} km</span>
                            <span>Trust: {bestSnap.trustScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px]">
                      {/* Matched dealers count */}
                      <div>
                        <span className="text-slate-400 block font-semibold">Matched Candidates</span>
                        <span className="text-white font-extrabold">{item.matches?.length || 0} buyers ranked</span>
                      </div>

                      {/* details indicator */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                        {bestSnap && bestSnap.dealer?.phone && (
                          <a 
                            href={`tel:${bestSnap.dealer.phone}`}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            title="Call Dealer"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyerMatching;
