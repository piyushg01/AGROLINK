import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, 
  ShieldAlert, Sparkles, RefreshCw, Calendar, Trash2, 
  ArrowLeft, Activity, Info, Brain
} from 'lucide-react';

// Custom SVG Line Chart for Temperature Forecast Trends (7-day forecast)
const TempForecastChart = ({ forecast = [] }) => {
  if (forecast.length === 0) {
    return (
      <div className="h-44 bg-slate-900/20 border border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-bold">
        No forecast data loaded.
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Max and Min temp boundaries
  const maxTemps = forecast.map(d => d.tempMax);
  const minTemps = forecast.map(d => d.tempMin);
  const absoluteMax = Math.max(...maxTemps, 40);
  const absoluteMin = Math.min(...minTemps, 10);
  const tempRange = absoluteMax - absoluteMin;

  const pointsMax = forecast.map((d, idx) => {
    const x = padding + (idx / 6) * chartWidth;
    const y = padding + chartHeight - ((d.tempMax - absoluteMin) / tempRange) * chartHeight;
    return { x, y, temp: d.tempMax };
  });

  const pointsMin = forecast.map((d, idx) => {
    const x = padding + (idx / 6) * chartWidth;
    const y = padding + chartHeight - ((d.tempMin - absoluteMin) / tempRange) * chartHeight;
    return { x, y, temp: d.tempMin };
  });

  const maxLinePath = pointsMax.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const minLinePath = pointsMin.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between h-[230px] text-left">
      <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" /> 7-Day Temp Range Trends (°C)
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[150px]">
        {/* Grid lines */}
        {[absoluteMin, absoluteMin + tempRange/2, absoluteMax].map((val, idx) => {
          const y = padding + chartHeight - ((val - absoluteMin) / tempRange) * chartHeight;
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding - 5} y={y + 3} fill="#64748b" fontSize="7" className="font-semibold" textAnchor="end">
                {Math.round(val)}°C
              </text>
            </g>
          );
        })}

        {/* Max Line */}
        <path d={maxLinePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        {/* Min Line */}
        <path d={minLinePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

        {/* Max Data points */}
        {pointsMax.map((p, idx) => (
          <g key={`max-${idx}`} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="#020617" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 8} fill="#f1f5f9" fontSize="6" fontWeight="bold" textAnchor="middle">
              {p.temp}°
            </text>
          </g>
        ))}

        {/* Min Data points */}
        {pointsMin.map((p, idx) => (
          <g key={`min-${idx}`} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#020617" strokeWidth="1.5" />
            <text x={p.x} y={p.y + 11} fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">
              {p.temp}°
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-semibold mt-1 px-1">
        {forecast.map((f, i) => (
          <span key={i}>{f.date.split('-').slice(1).join('/')}</span>
        ))}
      </div>
    </div>
  );
};

// Custom SVG Bar Chart for Forecast Rain Probability (7-day forecast)
const RainProbabilityChart = ({ forecast = [] }) => {
  if (forecast.length === 0) {
    return (
      <div className="h-44 bg-slate-900/20 border border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-bold">
        No forecast data loaded.
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (chartWidth / 7) - 10;

  return (
    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between h-[230px] text-left">
      <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5" /> 7-Day Rain Probability (%)
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[150px]">
        {/* Y Axis Grid lines */}
        {[0, 50, 100].map((val) => {
          const y = padding + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding - 5} y={y + 3} fill="#64748b" fontSize="7" className="font-semibold" textAnchor="end">
                {val}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {forecast.map((f, idx) => {
          const x = padding + 5 + (idx / 7) * chartWidth;
          const barHeight = (f.precipitationProbability / 100) * chartHeight;
          const y = padding + chartHeight - barHeight;

          return (
            <g key={idx} className="group cursor-pointer">
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={Math.max(2, barHeight)} 
                rx="3" 
                fill={f.precipitationProbability > 50 ? '#0284c7' : '#0ea5e9'} 
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
              <text x={x + barWidth/2} y={y - 6} fill="#f1f5f9" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                {f.precipitationProbability}%
              </text>
              {f.precipitationSum > 0 && (
                <text x={x + barWidth/2} y={padding + chartHeight + 11} fill="#64748b" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                  {f.precipitationSum}mm
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-semibold px-1">
        {forecast.map((f, i) => (
          <span key={i}>{f.date.split('-').slice(1).join('/')}</span>
        ))}
      </div>
    </div>
  );
};

const WeatherAdvisor = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t } = useLanguage();

  // State
  const [currentWeather, setCurrentWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [forecastList, setForecastList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherLogs();
  }, [token]);

  // Load history from express backend
  const fetchWeatherLogs = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/weather/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(data.history || []);
        // Populate active advisor states from latest historical entry if available
        if (data.history && data.history.length > 0) {
          const latest = data.history[0];
          setCurrentWeather({
            temperature: latest.temperature,
            humidity: latest.humidity,
            windSpeed: latest.windSpeed,
            rainProbability: latest.rainProbability,
            condition: latest.condition
          });
          setAdvisory(latest.advisory);
          setForecastList(latest.forecast || []);
        } else {
          // Trigger initial check automatically if history is empty
          triggerWeatherCheck();
        }
      }
    } catch (err) {
      console.error('Error fetching weather history:', err);
      setError('Could not connect to the database.');
    }
  };

  // Run weather advisor check
  const triggerWeatherCheck = async () => {
    setIsRefreshing(true);
    setError(null);

    const runCheck = async (coords = null) => {
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
        if (data.success) {
          setCurrentWeather(data.currentWeather);
          setAdvisory(data.advisory);
          setForecastList(data.forecast || []);
          setHistoryList(data.history || []);
        } else {
          setError(data.error || 'Weather check execution failed.');
        }
      } catch (err) {
        console.error('Weather advisor execution failed:', err);
        setError('Failed to query weather service. Check your internet connection.');
      } finally {
        setIsRefreshing(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          runCheck({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation check failed, using database coordinates:', error);
          runCheck();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      runCheck();
    }
  };

  // Delete a history log entry
  const handleDeleteLog = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/weather/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(prev => prev.filter(log => log._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete weather log:', err);
    }
  };

  const getWeatherIcon = (cond) => {
    switch (cond) {
      case 'Rainy':
        return <CloudRain className="w-8 h-8 text-sky-400" />;
      case 'Windy':
        return <Wind className="w-8 h-8 text-teal-400" />;
      case 'Cloudy':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      default:
        return <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />;
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header section */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        <div className="flex gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>
      </nav>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Link to="/dashboard" className="hover:text-emerald-400 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> {t('navHome')}
          </Link>
          <span>/</span>
          <Link to="/ai-hub" className="hover:text-emerald-400">{t('navAiHub')}</Link>
          <span>/</span>
          <span className="text-emerald-400">{t('weatherAdvisorTitle')}</span>
        </div>

        {/* Title */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sun className="w-7 h-7 text-amber-400 animate-spin-slow" />
              {t('weatherAdvisorTitle')}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {t('weatherAdvisorDesc')}
            </p>
          </div>

          <button
            onClick={triggerWeatherCheck}
            disabled={isRefreshing}
            className="btn-primary py-2.5 px-5 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? t('weatherChecking') : t('weatherCheckBtn')}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs font-semibold text-left">
            {error}
          </div>
        )}

        {/* Telemetry and Advisory Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Current Live Weather card */}
          {currentWeather ? (
            <div className="glass-panel p-6 flex flex-col justify-between md:col-span-1 border-emerald-500/10 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Current Local Weather</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{user?.address || 'Pune, MH'}</p>
                  </div>
                  {getWeatherIcon(currentWeather.condition)}
                </div>

                <div className="flex items-baseline gap-2 py-2">
                  <span className="text-4xl font-extrabold text-white">{currentWeather.temperature}°C</span>
                  <span className="text-xs font-bold text-slate-400">({currentWeather.condition})</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-900/30 p-2 rounded-xl text-center border border-slate-800/50">
                    <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block font-bold">Humidity</span>
                    <span className="text-xs font-extrabold text-white">{currentWeather.humidity}%</span>
                  </div>
                  <div className="bg-slate-900/30 p-2 rounded-xl text-center border border-slate-800/50">
                    <Wind className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block font-bold">Wind</span>
                    <span className="text-xs font-extrabold text-white">{currentWeather.windSpeed} km/h</span>
                  </div>
                  <div className="bg-slate-900/30 p-2 rounded-xl text-center border border-slate-800/50">
                    <CloudRain className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block font-bold">Rain Chance</span>
                    <span className="text-xs font-extrabold text-white">{currentWeather.rainProbability}%</span>
                  </div>
                </div>
              </div>

              {advisory && (
                <div className="mt-5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex gap-2">
                  <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {advisory.summary}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-6 flex items-center justify-center md:col-span-1 min-h-[250px]">
              <span className="text-xs text-slate-500 font-bold">Loading live weather feeds...</span>
            </div>
          )}

          {/* AI Advisor Panel (col-span-2) */}
          {advisory ? (
            <div className="glass-panel p-6 md:col-span-2 flex flex-col justify-between text-left">
              <div>
                <h2 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Agricultural Advisory Recommendations
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Irrigation Card */}
                  <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3">
                        <Droplets className="w-4 h-4 text-sky-400" />
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{t('irrigationAdvisor')}</h4>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">
                        {advisory.irrigation}
                      </p>
                    </div>
                  </div>

                  {/* Fertilization Card */}
                  <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{t('fertilizerAdvisor')}</h4>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">
                        {advisory.fertilization}
                      </p>
                    </div>
                  </div>

                  {/* Pest Risk Card */}
                  <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{t('pestAdvisor')}</h4>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">
                        {advisory.pestRisk}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-800/50 mt-4 pt-3 flex justify-between">
                <span>Recommendations updated live by AGRO-LINK AI</span>
                <span>Location coords: Lat {user?.location?.coordinates[1] || 18.52}, Lng {user?.location?.coordinates[0] || 73.88}</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 md:col-span-2 flex items-center justify-center min-h-[250px]">
              <span className="text-xs text-slate-500 font-bold">Awaiting weather metrics...</span>
            </div>
          )}

        </div>

        {/* 7-Day Forecast Grid */}
        {forecastList.length > 0 && (
          <div className="glass-panel p-6 text-left space-y-4">
            <h2 className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {t('weeklyForecast')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              {forecastList.map((day, idx) => {
                // simple date formatter
                const dateObj = new Date(day.date);
                const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                const dayDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return (
                  <div key={idx} className="bg-slate-900/30 border border-slate-800/40 p-3.5 rounded-xl text-center flex flex-col justify-between space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-white block">{dayName}</span>
                      <span className="text-[9px] text-slate-500 font-semibold block">{dayDate}</span>
                    </div>

                    <div className="py-1.5 flex justify-center">
                      {day.precipitationProbability > 50 ? (
                        <CloudRain className="w-6 h-6 text-sky-400" />
                      ) : day.precipitationProbability > 15 ? (
                        <Cloud className="w-6 h-6 text-slate-400" />
                      ) : (
                        <Sun className="w-6 h-6 text-amber-400" />
                      )}
                    </div>

                    <div className="text-[10px] font-bold text-white flex justify-center gap-2">
                      <span>{Math.round(day.tempMax)}°</span>
                      <span className="text-slate-500">{Math.round(day.tempMin)}°</span>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-sky-400 bg-sky-950/20 py-0.5 rounded">
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{day.precipitationProbability}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {forecastList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TempForecastChart forecast={forecastList} />
            <RainProbabilityChart forecast={forecastList} />
          </div>
        )}

        {/* Weather advisory history logs */}
        <div className="glass-panel p-6 text-left space-y-4">
          <h2 className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> {t('weatherCheckHistory')}
          </h2>

          {historyList.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs font-semibold text-slate-300">
                <thead className="bg-slate-900/80 text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-left">Check Date</th>
                    <th className="py-3 px-4 text-left">Location</th>
                    <th className="py-3 px-4 text-center">Temp</th>
                    <th className="py-3 px-4 text-center">Humidity</th>
                    <th className="py-3 px-4 text-center">Wind</th>
                    <th className="py-3 px-4 text-left">AI Advisory Summary</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/10">
                  {historyList.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-900/30">
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold max-w-[150px] truncate">{log.locationName}</td>
                      <td className="py-3.5 px-4 text-center text-amber-300 font-extrabold">{log.temperature}°C</td>
                      <td className="py-3.5 px-4 text-center text-sky-300">{log.humidity}%</td>
                      <td className="py-3.5 px-4 text-center text-teal-300">{log.windSpeed} km/h</td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium max-w-[320px] truncate" title={log.advisory.summary}>
                        {log.advisory.summary}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 font-bold border border-dashed border-slate-800 rounded-xl">
              No weather check logs available yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WeatherAdvisor;
