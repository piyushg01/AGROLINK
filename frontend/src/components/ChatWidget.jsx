import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, 
  Maximize2, Trash2, Sparkles, Gauge, Leaf, ChevronDown, ChevronUp, Bot, Settings
} from 'lucide-react';

const ChatWidget = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { language, t } = useLanguage();

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio / Speech State
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false);
  const recognitionRef = useRef(null);

  // Custom API keys settings
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [customGeminiKey, setCustomGeminiKey] = useState(() => localStorage.getItem('agrolink_custom_gemini_key') || '');
  const [customOpenaiKey, setCustomOpenaiKey] = useState(() => localStorage.getItem('agrolink_custom_openai_key') || '');

  // Soil Telemetry simulation panel inside the widget
  const [showTelemetryPanel, setShowTelemetryPanel] = useState(false);
  const [sendTelemetry, setSendTelemetry] = useState(true);
  const [moisture, setMoisture] = useState(48);
  const [ph, setPh] = useState(6.4);
  const [temperature, setTemperature] = useState(28.5);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch Chat History from MongoDB
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
        setError(data.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Could not connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Message to backend
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim() === '' || isLoading) return;

    setError(null);
    if (!textToSend) setInputText('');

    // Append user message locally for instant UI update
    const tempUserMsg = {
      _id: Date.now().toString(),
      message: text.trim(),
      sender: 'user',
      language: language,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);
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
        // Append AI response message
        setMessages(prev => [...prev, data.assistantMessage]);
        
        // Trigger Speech Output if enabled
        if (isSpeakingEnabled) {
          speakText(data.response, language);
        }
      } else {
        setError(data.message || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('Error asking copilot:', err);
      setError('Connection error. Falling back to local network.');
      // Local simulated response fallback in frontend in case backend is offline
      setTimeout(() => {
        const localFallback = getFrontendFallback(text, language);
        const tempAiMsg = {
          _id: (Date.now() + 1).toString(),
          message: localFallback,
          sender: 'assistant',
          language: language,
          createdAt: new Date()
        };
        setMessages(prev => [...prev, tempAiMsg]);
        if (isSpeakingEnabled) speakText(localFallback, language);
        setIsLoading(false);
      }, 1000);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Purge chat history
  const handleClearHistory = async () => {
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
        console.error('Error clearing history:', err);
      }
    }
  };

  // Text-To-Speech Synthesizer
  const speakText = (text, lang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop previous speech

    // Remove markdown formatting like asterisks or hashtags before speaking
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

  // Speech-To-Text Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
    };
    
    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setInputText(resultText);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Set language code based on current user context language
      if (language === 'hi') {
        recognitionRef.current.lang = 'hi-IN';
      } else if (language === 'mr') {
        recognitionRef.current.lang = 'mr-IN';
      } else {
        recognitionRef.current.lang = 'en-US';
      }
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

  const handleSaveApiKeys = () => {
    localStorage.setItem('agrolink_custom_gemini_key', customGeminiKey.trim());
    localStorage.setItem('agrolink_custom_openai_key', customOpenaiKey.trim());
    setShowApiSettings(false);
  };

  // Local fallback response generator for frontend-only offline cases
  const getFrontendFallback = (text, lang) => {
    const query = text.toLowerCase();
    let prefix = sendTelemetry ? `[Sensor Telemetry Integrated] ` : '';
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
    if (query.includes('water') || query.includes('पानी') || query.includes('पाणी') || query.includes('pani') || query.includes('irrigation')) {
      if (lang === 'hi') return prefix + "फसलों को तब सींचें जब नमी 35% से कम हो। टमाटर और कपास के लिए ड्रिप सिंचाई (Drip Irrigation) सर्वोत्तम है।";
      if (lang === 'mr') return prefix + "मातीतील ओलावा ३०% पेक्षा कमी झाल्यावर सिंचन करावे. फळबागांसाठी ठिबक सिंचन पद्धत वापरावी.";
      return prefix + "Irrigate when soil moisture drops below 35%. Drip irrigation is highly recommended to save water and prevent fungal collar rot.";
    }
    if (lang === 'hi') return "नमस्ते! मैं आपका एआई किसान कोपायलट हूं। खेती, खाद और फसल रोगों के बारे में मुझसे कोई भी प्रश्न पूछें।";
    if (lang === 'mr') return "नमस्कार! मी तुमचा एआय शेतकरी कोपायलट आहे. शेती, खत व्यवस्थापन आणि पीक रोगांबद्दल काहीही विचारा.";
    return "Hello! I am your AI Farmer Copilot. Ask me about crop nutrition, soil pH, or leaf yellowing symptoms.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[360px] md:w-[390px] h-[550px] mb-4 glass-panel flex flex-col overflow-hidden border border-emerald-500/30 rounded-2xl shadow-2xl animate-fade-in bg-slate-950/95 backdrop-blur-xl">
          
          {/* Header */}
          <div className="p-4 border-b border-emerald-500/20 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{t('copilotChatTitle')}</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  {t('copilotStatusOnline')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* API Settings Button */}
              <button 
                onClick={() => setShowApiSettings(!showApiSettings)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  showApiSettings 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400'
                }`}
                title="API Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen Button */}
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-copilot');
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                title={t('copilotOpenFullPage')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Clear History Button */}
              {messages.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                  title={t('copilotClearBtn')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Telemetry Context Toggle Panel */}
          <div className="border-b border-emerald-500/10 bg-slate-900/20">
            <button
              onClick={() => setShowTelemetryPanel(!showTelemetryPanel)}
              className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                {t('copilotSoilMetrics')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sendTelemetry ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                {showTelemetryPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {showTelemetryPanel && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-emerald-500/5 animate-fade-in text-[11px] font-semibold text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{t('copilotTelemetryCheckbox')}</span>
                  <input 
                    type="checkbox" 
                    checked={sendTelemetry} 
                    onChange={(e) => setSendTelemetry(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                {sendTelemetry && (
                  <div className="space-y-2.5">
                    {/* Moisture Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>{t('copilotMoistureLabel')}:</span>
                        <span className="text-emerald-400 font-bold">{moisture}%</span>
                      </div>
                      <input 
                        type="range" min="10" max="90" value={moisture}
                        onChange={(e) => setMoisture(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none accent-emerald-400 cursor-pointer"
                      />
                    </div>
                    {/* pH Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>{t('copilotPhLabel')}:</span>
                        <span className="text-emerald-400 font-bold">{ph}</span>
                      </div>
                      <input 
                        type="range" min="3.5" max="9.5" step="0.1" value={ph}
                        onChange={(e) => setPh(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none accent-emerald-400 cursor-pointer"
                      />
                    </div>
                    {/* Temperature Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>{t('copilotTempLabel')}:</span>
                        <span className="text-emerald-400 font-bold">{temperature}°C</span>
                      </div>
                      <input 
                        type="range" min="15" max="45" value={temperature}
                        onChange={(e) => setTemperature(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Messages or API Settings */}
          {showApiSettings ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/45">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Settings className="w-4 h-4 animate-spin-slow" />
                  <h4>API Configurations</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configure custom API keys to enable real-time replies from advanced LLMs. The keys are stored locally in your browser.
                </p>

                {/* Gemini API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-300 font-bold block">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    Get a free API key at{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Google AI Studio
                    </a>
                  </span>
                </div>

                {/* OpenAI API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-300 font-bold block">
                    OpenAI API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={customOpenaiKey}
                    onChange={(e) => setCustomOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveApiKeys}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer text-center"
                  >
                    Save Keys
                  </button>
                  <button
                    onClick={() => setShowApiSettings(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Leaf className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">How can I help you, {user?.name}?</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[230px]">Ask agricultural expert advice on crops, soil, water, and pest management.</p>
                  </div>

                  {/* Suggestions */}
                  <div className="w-full pt-4 grid grid-cols-1 gap-2 text-left">
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestLeaves'))}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {t('copilotSuggestLeaves')}
                    </button>
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestFertilizer'))}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      {t('copilotSuggestFertilizer')}
                    </button>
                    <button 
                      onClick={() => handleSendMessage(t('copilotSuggestCrop'))}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      {t('copilotSuggestCrop')}
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg._id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex gap-2 max-w-[85%]">
                      {msg.sender === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center flex-shrink-0 border border-slate-700 mt-1">
                          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      )}
                      <div 
                        className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-semibold ${
                          msg.sender === 'user' 
                            ? 'bg-emerald-500 text-white rounded-tr-none'
                            : 'bg-slate-900/60 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center border border-slate-700 mt-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-center text-[10px] font-bold">
                  {error}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Form Action Input */}
          {!showApiSettings && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }} 
              className="p-3 border-t border-emerald-500/20 bg-slate-950/90 flex items-center gap-2"
            >
              {/* Voice Mute / Output Toggle */}
              <button
                type="button"
                onClick={toggleSpeaking}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSpeakingEnabled 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750'
                }`}
                title={t('copilotToggleSpeech')}
              >
                {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Input Box */}
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('copilotPlaceholder')}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                disabled={isLoading}
              />

              {/* Voice input mic */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-red-500/20 border-red-500 text-red-450 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750'
                }`}
                title={t('copilotSpeakBtn')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputText || inputText.trim() === '' || isLoading}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold transition-all shadow-md disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      )}

      {/* Floating Widget Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-xl hover:shadow-emerald-500/20 border border-emerald-400/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer hover:rotate-12 animate-bounce-slow"
        title={t('copilotChatTitle')}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
};

export default ChatWidget;
