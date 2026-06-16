import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Leaf, Volume2, VolumeX, Mic, MicOff, Send, Trash2, 
  Sparkles, Bot, Activity, Gauge, LogOut, ArrowLeft,
  BookOpen, Thermometer, Droplet, Sun, CheckCircle, HelpCircle
} from 'lucide-react';

const AiCopilotPage = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  const recognitionRef = useRef(null);

  // Live IoT telemetry values
  const [sendTelemetry, setSendTelemetry] = useState(true);
  const [moisture, setMoisture] = useState(48);
  const [ph, setPh] = useState(6.4);
  const [temperature, setTemperature] = useState(28.5);

  // Custom API keys settings
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem('agrolink_custom_gemini_key') || '');
  const [customOpenaiKey, setCustomOpenaiKey] = useState(() => localStorage.getItem('agrolink_custom_openai_key') || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveApiKeys = () => {
    localStorage.setItem('agrolink_custom_gemini_key', customGeminiKey.trim());
    localStorage.setItem('agrolink_custom_openai_key', customOpenaiKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatHistory();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch from backend Mongoose history
  const fetchChatHistory = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/copilot/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.history);
      } else {
        setError(data.message || 'Failed to load conversation history');
      }
    } catch (err) {
      console.error(err);
      setError('Could not establish backend server sync. Running local Sandbox.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim() === '' || isLoading) return;

    setError(null);
    if (!textToSend) setInputText('');

    const newUserMsg = {
      _id: Date.now().toString(),
      message: text.trim(),
      sender: 'user',
      language: language,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const payload = {
        message: text.trim(),
        language: language,
        telemetry: sendTelemetry ? { moisture, ph, temperature } : null
      };

      const customGemini = localStorage.getItem('agrolink_custom_gemini_key') || '';
      const customOpenai = localStorage.getItem('agrolink_custom_openai_key') || '';

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/copilot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-gemini-key': customGemini,
          'x-openai-key': customOpenai
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.assistantMessage]);
        if (isSpeakingEnabled) {
          speakText(data.response, language);
        }
      } else {
        setError(data.message || 'Failed to generate advisory response');
      }
    } catch (err) {
      console.error('Error fetching copilot message:', err);
      setError('Connection failure. Providing offline recommendation.');
      
      // Fallback
      setTimeout(() => {
        const reply = getOfflineResponse(text, language);
        const newAiMsg = {
          _id: (Date.now() + 1).toString(),
          message: reply,
          sender: 'assistant',
          language: language,
          createdAt: new Date()
        };
        setMessages(prev => [...prev, newAiMsg]);
        if (isSpeakingEnabled) speakText(reply, language);
        setIsLoading(false);
      }, 1000);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const handleClearChat = async () => {
    if (!token) return;
    if (window.confirm(t('copilotClearBtn') + '?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/copilot/history`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text-To-Speech SpeechSynthesis
  const speakText = (text, lang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition Speech-To-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      setInputText(event.results[0][0].transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-text not supported in this browser. Please use Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
      recognitionRef.current.start();
    }
  };

  const toggleSpeaking = () => {
    setIsSpeakingEnabled(prev => {
      const next = !prev;
      if (!next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const getOfflineResponse = (text, lang) => {
    const query = text.toLowerCase();
    let prefix = sendTelemetry ? `[IoT Telemetry Linked] ` : '';
    if (query.includes('yellow') || query.includes('पीले') || query.includes('पिवळ') || query.includes('pila') || query.includes('pivl')) {
      if (lang === 'hi') return prefix + "पत्तियों का पीला पड़ना नाइट्रोजन की कमी या अधिक सिंचाई से हो सकता है। यदि मिट्टी की नमी 60% से अधिक है, तो सिंचाई रोकें और यूरिया (Urea) खाद डालें।";
      if (lang === 'mr') return prefix + "पाने पिवळी पडणे नायट्रोजनच्या कमतरतेमुळे किंवा जास्त पाण्यामुळे असू शकते. युरिया खताचा वापर करा आणि शेतातून पाण्याचा निचरा करा.";
      return prefix + "Yellowing leaves (chlorosis) usually signal Nitrogen deficiency or waterlogging. Apply Nitrogen-rich Urea and ensure field drainage is cleared.";
    }
    if (query.includes('fertilizer') || query.includes('खाद') || query.includes('खत') || query.includes('khad') || query.includes('khat')) {
      if (lang === 'hi') return prefix + "गेहूं और धान जैसी मुख्य फसलों के लिए बुवाई के समय DAP (18:46:0) का प्रयोग करें और वानस्पतिक विकास के लिए यूरिया का उपयोग करें।";
      if (lang === 'mr') return prefix + "पिकाच्या सुरुवातीच्या वाढीसाठी पेरणीच्या वेळी डीएपी (DAP) आणि ३० दिवसांनंतर नत्रासाठी युरिया द्यावा.";
      return prefix + "Use DAP (18:46:0) during sowing for root vigor, and top-dress with Urea for healthy green leafy development.";
    }
    if (lang === 'hi') return "नमस्ते! मैं आपका एआई किसान कोपायलट हूं। खेती, खाद और फसल रोगों के बारे में मुझसे कोई भी प्रश्न पूछें।";
    if (lang === 'mr') return "नमस्कार! मी तुमचा एआय शेतकरी कोपायलट आहे. शेती, खत व्यवस्थापन आणि पीक रोगांबद्दल काहीही विचारा.";
    return "Hello! I am your AI Farmer Copilot. Ask me about crop nutrition, soil pH, or leaf yellowing symptoms.";
  };

  return (
    <div className="min-h-screen pb-12 bg-[#050B07]">
      {/* Top Navbar */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Leaf className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
          <span className="text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5">{t('navCopilot')}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle buttons */}
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

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Soil Telemetry & Settings Panel */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Live Telemetry Panel */}
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4.5 h-4.5 text-emerald-400" />
                  {t('copilotSoilMetrics')}
                </h2>
                <input 
                  type="checkbox" 
                  checked={sendTelemetry} 
                  onChange={(e) => setSendTelemetry(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-emerald-500 bg-slate-800 border-slate-700 cursor-pointer focus:ring-emerald-400"
                />
              </div>

              <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                {t('copilotSoilMetricsDesc')}
              </p>

              {sendTelemetry ? (
                <div className="space-y-5 animate-fade-in text-xs font-semibold text-slate-350">
                  {/* Moisture */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5 text-blue-400" />
                        {t('copilotMoistureLabel')}
                      </span>
                      <span className="text-emerald-400">{moisture}%</span>
                    </div>
                    <input 
                      type="range" min="10" max="90" value={moisture}
                      onChange={(e) => setMoisture(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Min: 10%</span>
                      <span>Max: 90%</span>
                    </div>
                  </div>

                  {/* pH */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        {t('copilotPhLabel')}
                      </span>
                      <span className="text-emerald-400">{ph}</span>
                    </div>
                    <input 
                      type="range" min="3.5" max="9.5" step="0.1" value={ph}
                      onChange={(e) => setPh(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Acidic: 4.0</span>
                      <span>Alkaline: 9.0</span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        {t('copilotTempLabel')}
                      </span>
                      <span className="text-emerald-400">{temperature}°C</span>
                    </div>
                    <input 
                      type="range" min="15" max="45" value={temperature}
                      onChange={(e) => setTemperature(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Cool: 15°C</span>
                      <span>Hot: 45°C</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 font-bold border border-dashed border-slate-800 rounded-xl">
                  Telemetry connection disabled. General advisory mode active.
                </div>
              )}
            </div>

            {/* Custom API Key Settings Panel */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3">
                <Bot className="w-4.5 h-4.5 text-emerald-400" />
                <h2 className="text-md font-bold text-white">AI Key Settings</h2>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Enter your Google Gemini key to unlock full chatbot capabilities.
              </p>
              
              <div className="space-y-3">
                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">Google Gemini API Key</label>
                  <input 
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Get free key: <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google AI Studio</a>
                  </span>
                </div>

                {/* OpenAI Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">OpenAI API Key (Optional)</label>
                  <input 
                    type="password"
                    value={customOpenaiKey}
                    onChange={(e) => setCustomOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveApiKeys}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md cursor-pointer text-center"
                >
                  Save API Keys
                </button>
                {saveSuccess && (
                  <p className="text-[10px] text-emerald-405 font-bold text-center animate-pulse">
                    ✓ Keys saved locally!
                  </p>
                )}
              </div>
            </div>

            {/* Quick Agricultural Advisory Guides */}
            <div className="glass-panel p-6 space-y-4 hidden lg:block">
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Agronomist Quick Guides
              </h3>
              
              <div className="space-y-3 text-[11px] font-semibold text-slate-350">
                <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl leading-relaxed">
                  <h4 className="font-bold text-slate-200 mb-0.5">Crop Rotation Rule</h4>
                  Always follow heavy grain crops (like Paddy/Wheat) with Nitrogen-fixing legumes (like Gram/Compost) to restore nutrients naturally.
                </div>
                <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl leading-relaxed">
                  <h4 className="font-bold text-slate-200 mb-0.5">Nitrogen Excess Risk</h4>
                  Applying too much Urea triggers weak, watery leafy growth that easily succumbs to leaf blight pathogens.
                </div>
              </div>
            </div>

          </div>

          {/* Right Columns: Copilot Active Chat Container */}
          <div className="lg:col-span-3 glass-panel p-0 flex flex-col h-[650px] overflow-hidden border border-emerald-500/20 rounded-2xl shadow-xl bg-slate-950/60 backdrop-blur-md">
            
            {/* Chat Area Header */}
            <div className="p-5 border-b border-emerald-500/10 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white leading-tight">{t('copilotChatTitle')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Personalized AI Advisory Service</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button 
                  onClick={handleClearChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-900/40 hover:bg-red-900/50 text-red-400 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('copilotClearBtn')}
                </button>
              )}
            </div>

            {/* Chat Message Scroll Window */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto p-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 hover:scale-105 transition-all">
                    <Leaf className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Ask your Agriculture Copilot</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Say Namaste! I am here to help you diagnostics leaves disease, recommend fertilizer doses, soil pH fixes, or suggest Rabi/Kharif sowing trends.
                    </p>
                  </div>

                  {/* Suggestion Grid */}
                  <div className="w-full pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestLeaves'))}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{t('copilotSuggestLeaves')}</span>
                    </button>
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestFertilizer'))}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{t('copilotSuggestFertilizer')}</span>
                    </button>
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestWater'))}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{t('copilotSuggestWater')}</span>
                    </button>
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestCrop'))}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{t('copilotSuggestCrop')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg._id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex gap-3 max-w-[80%]">
                      {msg.sender === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 mt-1">
                          <Leaf className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <div 
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold ${
                          msg.sender === 'user' 
                            ? 'bg-emerald-500 text-white rounded-tr-none shadow-md shadow-emerald-500/10'
                            : 'bg-slate-900/60 text-slate-200 border border-slate-850 rounded-tl-none shadow-lg whitespace-pre-line'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mt-1">
                      <Leaf className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-slate-900/60 border border-slate-850 flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="max-w-md mx-auto p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Line Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 border-t border-emerald-500/10 bg-slate-950/90 flex items-center gap-3.5"
            >
              {/* Voice output toggle */}
              <button
                type="button"
                onClick={toggleSpeaking}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSpeakingEnabled 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                title={t('copilotToggleSpeech')}
              >
                {isSpeakingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Text box */}
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('copilotPlaceholder')}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500"
                disabled={isLoading}
              />

              {/* Voice input mic */}
              <button
                type="button"
                onClick={handleStartListening}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                title={t('copilotSpeakBtn')}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputText || inputText.trim() === '' || isLoading}
                className="p-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-emerald-500/20 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AiCopilotPage;
