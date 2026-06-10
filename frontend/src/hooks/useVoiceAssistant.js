import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const useVoiceAssistant = () => {
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const { logout } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Synthesize and speak text helper
  const speakText = (text, langCode = 'en') => {
    if (!window.speechSynthesis) return;
    
    // Cancel any active speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice/locale
    if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (langCode === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Supports multi-lingual phrases implicitly

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Voice Assistant started listening...');
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Voice Assistant stopped listening...');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const currentResultIndex = event.resultIndex;
      const text = event.results[currentResultIndex][0].transcript.toLowerCase().trim();
      setTranscript(text);
      console.log('Voice Assistant heard:', text);

      // Process voice commands
      handleVoiceCommand(text);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceCommand = (command) => {
    // 1. HELP COMMANDS
    if (command.includes('help') || command.includes('मदत') || command.includes('सहायता')) {
      speakText(
        "Available commands are: go to dashboard, go to marketplace, go to AI hub, go to chat, set Hindi, set Marathi, set English, or logout.",
        'en'
      );
    }
    
    // 2. NAVIGATION COMMANDS
    else if (command.includes('dashboard') || command.includes('डैशबोर्ड') || command.includes('डॅशबोर्ड')) {
      speakText("Navigating to dashboard", 'en');
      navigate('/dashboard');
    } 
    else if (command.includes('marketplace') || command.includes('बाज़ार') || command.includes('बाजारपेठ')) {
      speakText("Opening the marketplace catalog", 'en');
      navigate('/marketplace');
    } 
    else if (command.includes('ai hub') || command.includes('एआई हब') || command.includes('एआय हब') || command.includes('ai services')) {
      speakText("Opening the smart AI services page", 'en');
      navigate('/ai-hub');
    } 
    else if (command.includes('chat') || command.includes('चैट') || command.includes('चॅट') || command.includes('bids')) {
      speakText("Opening your negotiation chat rooms", 'en');
      navigate('/chat');
    }

    // 3. LANGUAGE TOGGLES
    else if (command.includes('set hindi') || command.includes('हिंदी सेट') || command.includes('हिंदी करा')) {
      setLanguage('hi');
      speakText("भाषा बदलकर हिंदी कर दी गई है।", 'hi');
    } 
    else if (command.includes('set marathi') || command.includes('मराठी सेट') || command.includes('मराठी करा')) {
      setLanguage('mr');
      speakText("भाषा बदलून मराठी करण्यात आली आहे.", 'mr');
    } 
    else if (command.includes('set english') || command.includes('अंग्रेजी सेट') || command.includes('इंग्रजी करा') || command.includes('english')) {
      setLanguage('en');
      speakText("Language successfully changed to English.", 'en');
    }

    // 4. LOGOUT COMMAND
    else if (command.includes('logout') || command.includes('लॉगआउट')) {
      speakText("Logging out. Goodbye!", 'en');
      logout();
      navigate('/login');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Set lang dynamically before starting if needed
      recognitionRef.current.start();
      speakText("Voice Assistant activated. How can I help you?", 'en');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      speakText("Voice Assistant deactivated.", 'en');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    speakText,
  };
};
