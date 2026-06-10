import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { 
  Leaf, Sun, CloudRain, Droplets, Thermometer, Gauge, 
  Mic, MicOff, AlertTriangle, ArrowRight, ShoppingBag, 
  Bot, RefreshCw, LogOut, CheckCircle, Wind, ShieldAlert, Sparkles, Activity, BarChart3,
  Scale, Users, Brain, CloudSun, Route, Compass
} from 'lucide-react';

// Animated Sunny SVG Component
const SunnyIcon = () => (
  <svg className="w-14 h-14 animate-spin-slow" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="12" className="fill-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 360) / 8;
      return (
        <line
          key={i}
          x1="32"
          y1="6"
          x2="32"
          y2="14"
          stroke="#fbbf24"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${angle} 32 32)`}
        />
      );
    })}
  </svg>
);

// Animated Rainy SVG Component
const RainyIcon = () => (
  <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none">
    <path
      d="M20 38 A8 8 0 0 1 20 22 A10 10 0 0 1 38 18 A8 8 0 0 1 42 38 Z"
      className="fill-slate-600 stroke-slate-500"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line x1="24" y1="42" x2="22" y2="48" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" className="animate-rain-drop-1" />
    <line x1="32" y1="44" x2="30" y2="50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" className="animate-rain-drop-2" />
    <line x1="40" y1="42" x2="38" y2="48" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" className="animate-rain-drop-3" />
  </svg>
);

// High-Fidelity Circular Gauge
const CircularGauge = ({ value, max, label, colorClass, unit, optimalRange }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;
  
  return (
    <div className="flex flex-col items-center p-4 bg-slate-950/30 rounded-2xl border border-slate-900/60 hover:border-emerald-500/30 transition-all duration-300 group relative flex-1">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-slate-900 fill-none"
            strokeWidth="5"
          />
          {/* Fill */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`fill-none transition-all duration-500 ${colorClass}`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Label */}
        <div className="absolute text-center">
          <span className="text-sm font-black text-white">{value}{unit}</span>
          <span className="text-[7.5px] text-slate-500 uppercase block font-bold mt-0.5">{label}</span>
        </div>
      </div>
      <span className="text-[8.5px] text-slate-500 font-bold mt-1.5 group-hover:text-emerald-400 transition-colors">{optimalRange}</span>
    </div>
  );
};

// Radar Outbreak Scanner
const RadarScanner = ({ riskIndex }) => {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center bg-slate-950/60 rounded-full border border-slate-900 overflow-hidden shadow-inner group">
      <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="44" className="stroke-slate-900 fill-none" strokeWidth="1" />
        <circle cx="56" cy="56" r="28" className="stroke-slate-900 fill-none" strokeWidth="1" />
        <circle cx="56" cy="56" r="12" className="stroke-slate-900 fill-none" strokeWidth="1" />
        <line x1="12" y1="56" x2="100" y2="56" className="stroke-slate-900" strokeWidth="1" />
        <line x1="56" y1="12" x2="56" y2="100" className="stroke-slate-900" strokeWidth="1" />
        
        {/* Glowing spore hits (blinking dots) */}
        {riskIndex > 25 && (
          <g>
            <circle cx="35" cy="40" r="2.5" className="fill-red-500 animate-ping" />
            <circle cx="35" cy="40" r="1.5" className="fill-red-400" />
          </g>
        )}
        {riskIndex > 50 && (
          <g>
            <circle cx="78" cy="72" r="2.5" className="fill-red-500 animate-ping" />
            <circle cx="78" cy="72" r="1.5" className="fill-red-400" />
          </g>
        )}
      </svg>
      
      {/* Radar sweep lines */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/25 rounded-full animate-radar-sweep pointer-events-none"></div>

      {/* Readout */}
      <div className="absolute text-center z-10">
        <span className="text-lg font-black text-slate-100">{riskIndex}%</span>
        <span className="text-[7px] text-slate-500 uppercase block font-black tracking-wide">Incubation</span>
      </div>
    </div>
  );
};

// Voice waveform Visualizer
const VoiceVisualizer = () => {
  return (
    <div className="flex items-center gap-1 h-5 px-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
      <div className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-voice-bar-1"></div>
      <div className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-voice-bar-2"></div>
      <div className="w-0.5 h-2 bg-emerald-400 rounded-full animate-voice-bar-3"></div>
      <div className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-voice-bar-4"></div>
      <div className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-voice-bar-5"></div>
    </div>
  );
};

const Dashboard = () => {
  const { token, user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const voice = useVoiceAssistant();

  // Simulated IoT parameters
  const [moisture, setMoisture] = useState(48);
  const [temperature, setTemperature] = useState(28.5);
  const [ph, setPh] = useState(6.4);
  const [soilWarning, setSoilWarning] = useState(false);

  // Weather parameters
  const [isRaining, setIsRaining] = useState(false);
  const [weatherTemp, setWeatherTemp] = useState(31);
  const [humidity, setHumidity] = useState(55);
  const [windSpeed, setWindSpeed] = useState(12);
  const [rainProbability, setRainProbability] = useState(0);
  const [conditionText, setConditionText] = useState('Mostly Sunny');
  const [advisoryText, setAdvisoryText] = useState('');
  const [weatherLocation, setWeatherLocation] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);

  // AI Fungal Outbreak Forecast State
  const [sporeRisk, setSporeRisk] = useState(null);
  const [sporeLoading, setSporeLoading] = useState(false);

  useEffect(() => {
    // Soil moisture warning trigger
    if (moisture < 30) {
      setSoilWarning(true);
    } else {
      setSoilWarning(false);
    }
  }, [moisture]);

  useEffect(() => {
    const fetchSporeRisk = async () => {
      setSporeLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/ai/outbreak-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            humidity: parseFloat(humidity),
            temperature: parseFloat(temperature),
            soilPh: parseFloat(ph),
            cropName: 'Wheat'
          })
        });
        const data = await response.json();
        if (data.success) {
          setSporeRisk(data);
          setSporeLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Flask AI Offline. Running local SGI outbreak risk engine...', err);
      }

      // Local fallback calculation
      const humFactor = Math.max(0, (humidity - 40) * 1.5);
      const tempFactor = Math.max(0, 30 - Math.abs(temperature - 26) * 2);
      const phFactor = Math.max(0, (7.0 - ph) * 10);
      const prob = Math.min(99.0, Math.max(5.0, (humFactor * 0.5) + (tempFactor * 0.3) + (phFactor * 0.2)));
      
      let status = "Safe";
      let prescriptions = ["Normal maintenance. Apply vermicompost and maintain regular watering."];
      if (prob > 75) {
        status = "Danger (Critical Outbreak Risk)";
        prescriptions = [
          "Apply proactive Copper Oxychloride spray immediately within 24 hours.",
          "Dilute Cold Pressed Neem Oil (1:100) and mist lower stems.",
          "Irrigate early morning only to lower leaf-wetness duration."
        ];
      } else if (prob > 45) {
        status = "Warning (High Spore Germination)";
        prescriptions = [
          "Apply preventative Neem oil spray (1:200 ratio) across crops.",
          "Prune foliage below 1 foot height to maximize ventilation."
        ];
      } else if (prob > 20) {
        status = "Moderate Spore Incubation";
        prescriptions = [
          "Monitor leaves for first spot warning signs.",
          "Maintain balanced potassium feeding to strengthen cell walls."
        ];
      }

      setSporeRisk({
        success: true,
        sporeIndex: Math.round(prob * 100) / 100,
        riskStatus: status,
        sporeSpreadVector: humidity > 60 ? "North-East (Speed: 14 km/h)" : "No active spore vectors",
        prescriptions: prescriptions
      });
      setSporeLoading(false);
    };

    fetchSporeRisk();
  }, [humidity, temperature, ph]);

  const fetchRealWeather = async (coords = null) => {
    if (!token) return;
    setWeatherLoading(true);
    try {
      const bodyData = coords ? { latitude: coords.latitude, longitude: coords.longitude } : {};
      const response = await fetch('http://localhost:8000/api/weather/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      const data = await response.json();
      if (data.success && data.currentWeather) {
        const cw = data.currentWeather;
        setWeatherTemp(cw.temperature);
        setHumidity(cw.humidity);
        setWindSpeed(cw.windSpeed);
        setRainProbability(cw.rainProbability);
        setIsRaining(cw.condition === 'Rainy' || cw.rainProbability > 40);
        setConditionText(cw.condition);
        setAdvisoryText(data.advisory?.summary || `${cw.temperature}°C with ${cw.humidity}% humidity.`);
        setWeatherLocation(data.history?.[0]?.locationName || user?.address || 'Pune, MH');
        
        // Feed real weather temperature into the ambient telemetry sensor parameter
        setTemperature(cw.temperature);
      }
    } catch (err) {
      console.error('Failed to fetch real weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleWeatherRefresh = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRealWeather({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation refresh failed, using database coordinates:', error);
          fetchRealWeather();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchRealWeather();
    }
  };

  useEffect(() => {
    if (!token) return;
    
    // Initial fetch using geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRealWeather({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation initial load failed, using database coordinates:', error);
          fetchRealWeather();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchRealWeather();
    }
  }, [token]);

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Header/Nav */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="text-emerald-400 hover:text-emerald-300">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/crop-health" className="hover:text-emerald-400 transition-colors">{t('navCropHealth')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
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

          {/* User profile */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-100">{user?.name}</span>
            <span className="text-[10px] text-emerald-400 font-semibold capitalize">{user?.role}</span>
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

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Welcome Section */}
        <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Namaste, <span className="text-emerald-400">{user?.name}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your farming dashboard is up to date. Position GPS: <span className="text-slate-300 font-semibold">{user?.address}</span>
            </p>
          </div>
          
          {/* Voice Assistant Visual Block */}
          <button
            onClick={voice.toggleListening}
            className={`flex items-center gap-3.5 py-3 px-5 rounded-2xl border transition-all cursor-pointer ${
              voice.isListening 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-350 animate-pulse-slow shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-500'
            }`}
          >
            {voice.isListening ? <VoiceVisualizer /> : (voice.isListening ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />)}
            <div className="text-left text-xs">
              <p className="font-bold">{t('voiceAssistant')}</p>
              <p className="text-[9px] opacity-75">{voice.isListening ? 'Listening to voice...' : 'Click to activate'}</p>
            </div>
          </button>
        </div>

        {/* Live speech feedback banner */}
        {voice.isListening && voice.transcript && (
          <div className="glass-panel bg-slate-900/60 p-4 border-l-4 border-l-emerald-400 rounded-lg flex items-center gap-3">
            <Bot className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-200">
              Heard command: <span className="italic text-emerald-300">"{voice.transcript}"</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* IoT Soil Moisture monitoring Panel */}
          <div className="glass-panel p-6 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                {t('iotHeader')}
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                IoT Live Sync
              </span>
            </div>

            {soilWarning && (
              <div className="bg-amber-500/15 border border-amber-500/30 text-amber-250 px-4 py-3.5 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('iotAlertDanger')}</p>
                  <Link to="/marketplace" className="text-amber-350 text-xs font-bold hover:underline mt-1.5 flex items-center gap-1">
                    Buy fertilizer products <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Circular Gauges Row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CircularGauge 
                value={moisture} 
                max={100} 
                label={t('moisture')} 
                colorClass="stroke-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" 
                unit="%" 
                optimalRange="Standard: 40-60%" 
              />
              <CircularGauge 
                value={temperature} 
                max={50} 
                label={t('temperature')} 
                colorClass="stroke-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" 
                unit="°C" 
                optimalRange="Optimal: 25-32°C" 
              />
              <CircularGauge 
                value={ph} 
                max={14} 
                label={t('soilPh')} 
                colorClass="stroke-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" 
                unit="" 
                optimalRange="Neutral: 6.0-7.5" 
              />
            </div>

            {/* Slider Deck for IoT control simulation */}
            <div className="bg-slate-900/20 p-4.5 rounded-xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">IoT Sensor Telemetry Deck</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Moisture Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Moisture:</span>
                    <span className="text-emerald-400">{moisture}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={moisture}
                    onChange={(e) => setMoisture(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Temperature Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Temperature:</span>
                    <span className="text-amber-400">{temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    step="0.5"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* pH Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Soil pH:</span>
                    <span className="text-blue-400">{ph}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Weather + Outbreak Radar */}
          <div className="flex flex-col gap-6">
            
            {/* Weather Card */}
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {isRaining ? <CloudRain className="w-5 h-5 text-blue-400 animate-bounce" /> : <Sun className="w-5 h-5 text-amber-400" />}
                    {t('weatherHeader')}
                  </h2>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5 max-w-[200px] truncate" title={weatherLocation || user?.address || 'Pune, MH'}>
                    {weatherLocation || user?.address || 'Pune, MH'}
                  </span>
                </div>
                <button 
                  onClick={handleWeatherRefresh}
                  disabled={weatherLoading}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh live weather telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800 justify-around">
                {/* Weather Animation */}
                {isRaining ? <RainyIcon /> : <SunnyIcon />}
                
                <div className="flex flex-col text-center">
                  <span className="text-3xl font-extrabold text-white">{weatherTemp}°C</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{conditionText}</span>
                </div>
                
                <div className="border-r border-slate-800 h-10"></div>

                <div className="flex flex-col gap-1 text-[10px] text-slate-450 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    <span>{t('weatherHumidity')}: {humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-amber-400" />
                    <span>Wind: {windSpeed} km/h</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase block">{t('weatherAdvisory')}</span>
                <p className="text-sm leading-relaxed text-slate-350 bg-emerald-950/10 border border-emerald-900/20 p-3.5 rounded-xl">
                  {advisoryText || (isRaining ? t('weatherAdviseRain') : t('weatherAdviseFine'))}
                </p>
                <Link
                  to="/weather-advisor"
                  className="w-full btn-secondary text-center text-xs py-2.5 px-4 font-bold flex items-center justify-center gap-1.5 mt-3 cursor-pointer border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Brain className="w-4 h-4 text-emerald-400" /> Open Full AI Weather Advisor
                </Link>
              </div>
            </div>

            {/* Fungal Outbreak Radar Card */}
            <div className="glass-panel p-6 space-y-6 border-t-4 border-t-amber-500">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                  AI Spore Outbreak Radar
                </h2>
                <span className="text-[9px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                  Proactive Radar
                </span>
              </div>

              {sporeLoading ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-[10px] text-slate-400 font-bold">Simulating spore flight vectors...</span>
                </div>
              ) : sporeRisk ? (
                <div className="space-y-4 animate-fade-in text-xs font-semibold">
                  <div className="flex items-center gap-4 bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 justify-between">
                    <RadarScanner riskIndex={Math.round(sporeRisk.sporeIndex)} />
                    <div className="flex-1 space-y-1 pl-2">
                      <span className="text-[9px] text-slate-500 uppercase font-black block leading-none">Status</span>
                      <p className={`text-xs font-extrabold ${
                        sporeRisk.sporeIndex > 75 ? 'text-red-400' : sporeRisk.sporeIndex > 45 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {sporeRisk.riskStatus}
                      </p>
                      <p className="text-[9px] text-slate-450 leading-relaxed font-bold mt-1.5 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-blue-400" />
                        Vector: {sporeRisk.sporeSpreadVector}
                      </p>
                    </div>
                  </div>

                  {/* Biological Prescriptions */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Bio-Chemical Prescription</span>
                    <ul className="space-y-1.5 text-[10px] text-slate-350">
                      {sporeRisk.prescriptions.map((p, idx) => (
                        <li key={idx} className="flex gap-2 items-start leading-relaxed bg-slate-950/20 p-2 rounded-lg border border-slate-850/40">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              ) : null}
            </div>

          </div>
        </div>

        {/* Farmer's Field Handbook & Dictionary */}
        <div className="glass-panel p-6 space-y-4 border-l-4 border-l-emerald-500 bg-gradient-to-tr from-emerald-950/10 to-slate-900/40">
          <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{t('fieldHandbookTitle')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Moisture Guide */}
            <div className="space-y-2 p-3.5 bg-slate-950/20 rounded-xl border border-slate-900/60 hover:border-emerald-500/20 transition-all group">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                <Droplets className="w-4 h-4 text-emerald-400" />
                {t('moistureHandbookTitle')}
              </h3>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {t('moistureHandbookDesc')}
              </p>
            </div>

            {/* pH Guide */}
            <div className="space-y-2 p-3.5 bg-slate-950/20 rounded-xl border border-slate-900/60 hover:border-blue-500/20 transition-all group">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-blue-400 transition-colors">
                <Gauge className="w-4 h-4 text-blue-450" />
                {t('phHandbookTitle')}
              </h3>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {t('phHandbookDesc')}
              </p>
            </div>

            {/* Temp Guide */}
            <div className="space-y-2 p-3.5 bg-slate-950/20 rounded-xl border border-slate-900/60 hover:border-amber-500/20 transition-all group">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
                <Thermometer className="w-4 h-4 text-amber-400" />
                {t('tempHandbookTitle')}
              </h3>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {t('tempHandbookDesc')}
              </p>
            </div>

            {/* Fungal Spore Guide */}
            <div className="space-y-2 p-3.5 bg-slate-950/20 rounded-xl border border-slate-900/60 hover:border-red-500/20 transition-all group">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-red-400 transition-colors">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                {t('sporeHandbookTitle')}
              </h3>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {t('sporeHandbookDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Hub Grid */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            Core Platform Services Navigation
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-emerald-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-emerald-400 transition-colors">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  AGRO Marketplace
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Farmer grain listings, shopkeeper fertilizers, and dealer bidding contracts. Browse and upload.
                </p>
              </div>
              <Link to="/marketplace" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                Open Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-blue-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-blue-400 transition-colors">
                  <Bot className="w-5 h-5 text-blue-400" />
                  AI Solutions Hub
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scan leaf diseases using image upload, estimate monthly crop prices with ML modeling, and analyze NPK soil nutrient ratios.
                </p>
              </div>
              <Link to="/ai-hub" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                Launch AI Hub <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-purple-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-purple-400 transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  {t('navPricePredictor')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Forecast crop values for Tomorrow, 3-Day, 7-Day, and 15-Day windows. View trend charts and AI hold/sell advisories.
                </p>
              </div>
              <Link to="/price-prediction" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                Launch Price Predictor <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-amber-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-amber-400 transition-colors">
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  Bid Negotiation Panel
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Check pending negotiations and engage in real-time pricing chatRooms over crop deals.
                </p>
              </div>
              <Link to="/chat" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                View Negotiations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-red-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-red-400 transition-colors">
                  <Scale className="w-5 h-5 text-red-400" />
                  {t('negotiationAssistantTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluate dealer bid offers compared to current market values. Verify deal fairness, profit margin gaps, and negotiation leverage.
                </p>
              </div>
              <Link to="/negotiation-assistant" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-red-500/30 text-red-400 hover:bg-red-500/10">
                Launch Assistant <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-emerald-500 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-emerald-400 transition-colors">
                  <Users className="w-5 h-5 text-emerald-400" />
                  {t('buyerMatchingTitle')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connect dynamically with the top registered buyers. Optimize for best profits or closest transportation logistics.
                </p>
              </div>
              <Link to="/buyer-matching" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                Find Best Buyers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-emerald-400 hover:scale-[1.02] transform transition-all group">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-emerald-450 transition-colors">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  {t('navCropHealth')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scan leaf diseases, access pathology reports, see treatment costs, and order fertilizers/pesticides from nearby shopkeepers.
                </p>
              </div>
              <Link to="/crop-health" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                Launch Crop Clinic <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-teal-500 hover:scale-[1.02] transform transition-all group bg-gradient-to-tr from-teal-950/10 to-slate-900/60">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-teal-400 transition-colors">
                  <Bot className="w-5 h-5 text-teal-400" />
                  {t('navAgentSystem')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run the unified 4-Agent pipeline (pathology diagnosis, market trend forecasts, smart buyer matching, and transport logistics) in a single run.
                </p>
              </div>
              <Link to="/agent-system" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-teal-500/35 text-teal-400 hover:bg-teal-500/10">
                Launch Multi-Agent System <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-emerald-500 hover:scale-[1.02] transform transition-all group bg-gradient-to-tr from-emerald-950/10 to-slate-900/60">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2 group-hover:text-emerald-400 transition-colors">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  {t('navAiCommandCenter')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Consolidated enterprise operations desk running pathology diagnosis, pricing forecasts, buyer selection, and net profit calculations.
                </p>
              </div>
              <Link to="/ai-command" className="btn-secondary py-2 text-center text-xs mt-4 flex items-center justify-center gap-2 cursor-pointer border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/10">
                Launch Command Center <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
