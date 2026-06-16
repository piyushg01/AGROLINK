import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { 
  Leaf, ArrowLeft, UploadCloud, Activity, FileText, Printer, 
  ShoppingBag, ShieldAlert, CheckCircle, Calendar, Trash2, 
  MapPin, Sparkles, AlertTriangle, Star, Check, Award, Bot
} from 'lucide-react';

// Custom SVG Chart for Crop Health Severity Timeline
const SeverityTimelineChart = ({ history = [] }) => {
  if (history.length === 0) {
    return (
      <div className="h-44 bg-slate-900/20 border border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-bold">
        No crop scans history available yet.
      </div>
    );
  }

  // Reverse list to show chronological order
  const chronological = [...history].reverse().slice(-10); // show last 10 scans

  const severityMapping = {
    'None': 0,
    'Low': 1,
    'Medium': 2,
    'High': 3
  };

  const points = chronological.map((item, idx) => {
    const value = severityMapping[item.severity] ?? 0;
    return {
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value,
      disease: item.disease,
      severity: item.severity
    };
  });

  const width = 500;
  const height = 180;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Map coordinates (Y is inverted in SVG)
  const coords = points.map((p, idx) => {
    const x = padding + (idx / Math.max(1, points.length - 1)) * chartWidth;
    // Map value (0 to 3) to height
    const y = padding + chartHeight - (p.value / 3) * chartHeight;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = coords.length > 0 
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z` 
    : '';

  return (
    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between h-[230px] text-left">
      <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" /> Severity Timeline Trends
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[150px]">
        <defs>
          <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3].map((val) => {
          const y = padding + chartHeight - (val / 3) * chartHeight;
          const label = val === 3 ? 'High' : val === 2 ? 'Medium' : val === 1 ? 'Low' : 'None';
          return (
            <g key={val}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding - 5} y={y + 3} fill="#64748b" fontSize="7" className="font-semibold" textAnchor="end">
                {label}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaPath && <path d={areaPath} fill="url(#severityGrad)" />}

        {/* Main Line */}
        {linePath && <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />}

        {/* Data points */}
        {coords.map((c, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle 
              cx={c.x} 
              cy={c.y} 
              r="4" 
              fill={c.value === 3 ? '#ef4444' : c.value === 2 ? '#f59e0b' : c.value === 1 ? '#3b82f6' : '#10b981'} 
              stroke="#020617" 
              strokeWidth="1.5" 
              className="hover:scale-125 transition-transform"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <rect x={c.x - 45} y={c.y - 28} width="90" height="20" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
              <text x={c.x} y={c.y - 15} fill="#f1f5f9" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                {c.disease.split(' (')[0]} ({c.date})
              </text>
            </g>
          </g>
        ))}
      </svg>
      <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold mt-1 px-1">
        <span>Oldest Scan</span>
        <span>Latest Scan</span>
      </div>
    </div>
  );
};

// Custom SVG Bar Chart for Disease Occurrence counts
const DiseaseOccurrencesChart = ({ history = [] }) => {
  if (history.length === 0) {
    return (
      <div className="h-44 bg-slate-900/20 border border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-bold">
        No disease distribution data available.
      </div>
    );
  }

  // Count occurrences of each disease
  const counts = {};
  history.forEach(item => {
    const key = item.disease.split(' (')[0]; // Clean name (remove Puccinia/Alternaria details)
    counts[key] = (counts[key] || 0) + 1;
  });

  const data = Object.keys(counts).map(disease => ({
    name: disease,
    count: counts[disease]
  })).sort((a, b) => b.count - a.count).slice(0, 4); // Show top 4 categories

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between h-[230px] text-left">
      <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Disease Distribution
      </h3>
      <div className="flex-1 flex flex-col justify-around">
        {data.map((d, idx) => {
          const percentage = (d.count / maxCount) * 100;
          const colors = [
            'bg-emerald-500 shadow-emerald-500/10',
            'bg-red-500 shadow-red-500/10',
            'bg-amber-500 shadow-amber-500/10',
            'bg-blue-500 shadow-blue-500/10'
          ];
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span className="truncate max-w-[200px]">{d.name}</span>
                <span>{d.count} {d.count === 1 ? 'Scan' : 'Scans'}</span>
              </div>
              <div className="h-3 w-full bg-slate-900/60 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colors[idx % colors.length]}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CropHealth = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const voice = useVoiceAssistant();

  // State
  const [historyList, setHistoryList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [nearbyProducts, setNearbyProducts] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('symptoms'); // symptoms, treatments, inputs
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // References
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Load history from express backend
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/crop-health/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(data.history || []);
        // Set first history item as active on start if available
        if (data.history && data.history.length > 0 && !activeDiagnosis) {
          setActiveDiagnosis(data.history[0]);
          fetchNearbyShopkeepersSimulationFallback(data.history[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Could not establish database connection.');
    }
  };

  // Simulation fetch for nearby products based on diagnosis if offline
  const fetchNearbyShopkeepersSimulationFallback = async (diagnosis) => {
    // Attempt to search coordinates from user profile
    const coords = user?.location?.coordinates || [73.8850, 18.7250];
    const recommendedInputs = [...(diagnosis.recommendedFertilizers || []), ...(diagnosis.recommendedPesticides || [])];

    // Mock products list corresponding to seeded Sunita Sharma shopkeeper
    const mockProducts = [
      {
        _id: "prod_1",
        name: "NPK 19-19-19 Premium Fertilizer",
        category: "Fertilizer",
        price: 450,
        description: "Completely water-soluble compound fertilizer containing equal ratios of nitrogen, phosphorus, and potassium.",
        quantityInStock: 100,
        shopkeeper: {
          _id: "shop_1",
          name: "Sunita Sharma",
          address: "Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune",
          phone: "+91 77777 66666",
          rating: 4.8
        },
        distanceKm: 4.8,
        isMatch: recommendedInputs.some(rec => rec.includes("NPK"))
      },
      {
        _id: "prod_2",
        name: "Organic Neem Oil Pesticide (Cold Pressed)",
        category: "Pesticide",
        price: 180,
        description: "100% natural cold-pressed pure neem oil. Excellent organic insect repellent and fungicide.",
        quantityInStock: 50,
        shopkeeper: {
          _id: "shop_1",
          name: "Sunita Sharma",
          address: "Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune",
          phone: "+91 77777 66666",
          rating: 4.8
        },
        distanceKm: 4.8,
        isMatch: recommendedInputs.some(rec => rec.includes("Neem"))
      },
      {
        _id: "prod_3",
        name: "Single Super Phosphate (SSP) Granular",
        category: "Fertilizer",
        price: 350,
        description: "Granular fertilizer supplying active phosphorus, calcium, and sulfur directly to roots.",
        quantityInStock: 80,
        shopkeeper: {
          _id: "shop_1",
          name: "Sunita Sharma",
          address: "Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune",
          phone: "+91 77777 66666",
          rating: 4.8
        },
        distanceKm: 4.8,
        isMatch: recommendedInputs.some(rec => rec.includes("SSP") || rec.includes("Phosphate"))
      },
      {
        _id: "prod_4",
        name: "Chlorothalonil Fungicide 75% WP",
        category: "Pesticide",
        price: 290,
        description: "Broad-spectrum preventative fungicide. Highly effective against Early/Late Blight.",
        quantityInStock: 40,
        shopkeeper: {
          _id: "shop_1",
          name: "Sunita Sharma",
          address: "Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune",
          phone: "+91 77777 66666",
          rating: 4.8
        },
        distanceKm: 4.8,
        isMatch: recommendedInputs.some(rec => rec.includes("Chlorothalonil"))
      },
      {
        _id: "prod_5",
        name: "Mancozeb Fungicide Premium",
        category: "Pesticide",
        price: 260,
        description: "Premium protective fungicide to control common rust, downy mildew, and leaf spots.",
        quantityInStock: 45,
        shopkeeper: {
          _id: "shop_1",
          name: "Sunita Sharma",
          address: "Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune",
          phone: "+91 77777 66666",
          rating: 4.8
        },
        distanceKm: 4.8,
        isMatch: recommendedInputs.some(rec => rec.includes("Mancozeb"))
      }
    ];

    // Filter matched and sort
    const processed = mockProducts.map(prod => ({
      ...prod,
      distanceKm: parseFloat((4.0 + Math.random() * 8).toFixed(1))
    })).sort((a, b) => {
      if (a.isMatch && !b.isMatch) return -1;
      if (!a.isMatch && b.isMatch) return 1;
      return a.distanceKm - b.distanceKm;
    });

    setNearbyProducts(processed);
  };

  // Select leaf file upload
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadImage(file);
  };

  // Drag and drop events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  // Convert file to base64 and hit Express endpoint
  const uploadImage = async (file) => {
    setIsUploading(true);
    setError(null);
    setOrderSuccess(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/crop-health/diagnose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        if (data.success) {
          setActiveDiagnosis(data.diagnosis);
          setNearbyProducts(data.nearbyProducts || []);
          setHistoryList(prev => [data.diagnosis, ...prev]);

          // Voice voice announcement
          const voiceMsg = `${data.diagnosis.cropName} diagnosis shows ${data.diagnosis.disease} with ${data.diagnosis.severity} severity.`;
          voice.speakText(voiceMsg, 'en');
        } else {
          setError(data.error || 'Diagnosis failed.');
        }
      } catch (err) {
        console.error('API Error:', err);
        setError('Connection to Express gateway failed. Using offline simulation...');
        // Offline Fallback simulation
        simulateOfflineDiagnosis(base64Image);
      } finally {
        setIsUploading(false);
      }
    };
  };

  // Offline mock simulation if API completely fails
  const simulateOfflineDiagnosis = (base64Str) => {
    setTimeout(() => {
      const mockResult = {
        _id: "mock_" + Date.now(),
        cropName: 'Tomato',
        disease: 'Early Blight (Alternaria solani)',
        confidence: 88.4,
        severity: 'High',
        description: 'Blight is a highly destructive fungal disease characterized by dark brown/black lesions surrounded by yellow halos, rapidly leading to tissue decay.',
        symptoms: ['Target-like concentric ring spots', 'Dark water-soaked lesions on stems', 'Rapid defoliation'],
        treatment: [
          'Spray Chlorothalonil or Metalaxyl immediately.',
          'Prune lower leaves to improve airflow and prevent soil splash.',
          'Avoid overhead irrigation; water directly at the roots.'
        ],
        estimatedCost: '₹600 - ₹1200',
        recommendedFertilizers: ['Single Super Phosphate (SSP) Granular'],
        recommendedPesticides: ['Chlorothalonil Fungicide 75% WP', 'Organic Neem Oil Pesticide (Cold Pressed)'],
        image: base64Str,
        createdAt: new Date()
      };

      setActiveDiagnosis(mockResult);
      setHistoryList(prev => [mockResult, ...prev]);
      fetchNearbyShopkeepersSimulationFallback(mockResult);

      const voiceMsg = `Tomato diagnosis shows Early Blight with High severity. We recommend Chlorothalonil fungicide.`;
      voice.speakText(voiceMsg, 'en');
    }, 1500);
  };

  // Delete scan history
  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this diagnostic record from your logs?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/crop-health/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryList(prev => prev.filter(item => item._id !== id));
        if (activeDiagnosis?._id === id) {
          const remaining = historyList.filter(item => item._id !== id);
          setActiveDiagnosis(remaining.length > 0 ? remaining[0] : null);
          if (remaining.length > 0) {
            fetchNearbyShopkeepersSimulationFallback(remaining[0]);
          } else {
            setNearbyProducts([]);
          }
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      // Local filter fallback
      setHistoryList(prev => prev.filter(item => item._id !== id));
    }
  };

  // Place order for product
  const handleOpenBuyModal = (product) => {
    setSelectedProduct(product);
    setPurchaseQty(1);
    setOrderSuccess(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct) return;
    setIsBuying(true);
    setOrderSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/crop-health/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: purchaseQty
        })
      });

      const data = await response.json();
      if (data.success) {
        setOrderSuccess(`Success! Order placed with ${selectedProduct.shopkeeper.name}. Total: ₹${selectedProduct.price * purchaseQty}.`);
        // Update product list stock count locally
        setNearbyProducts(prev => prev.map(p => {
          if (p._id === selectedProduct._id) {
            return { ...p, quantityInStock: Math.max(0, p.quantityInStock - purchaseQty) };
          }
          return p;
        }));
        setTimeout(() => setSelectedProduct(null), 3000);
      } else {
        alert(data.error || 'Failed to place order.');
      }
    } catch (err) {
      // Fallback buy trigger simulation
      console.warn('Backend connection offline, simulating mock product order...', err);
      setOrderSuccess(`Mock Success! Order placed with ${selectedProduct.shopkeeper.name}. Total: ₹${selectedProduct.price * purchaseQty}.`);
      setNearbyProducts(prev => prev.map(p => {
        if (p._id === selectedProduct._id) {
          return { ...p, quantityInStock: Math.max(0, p.quantityInStock - purchaseQty) };
        }
        return p;
      }));
      setTimeout(() => setSelectedProduct(null), 3000);
    } finally {
      setIsBuying(false);
    }
  };

  // Open Sample preset
  const loadPresetSample = (type) => {
    setError(null);
    setOrderSuccess(null);
    let sample = {};

    if (type === 'healthy') {
      sample = {
        _id: "sample_healthy",
        cropName: 'Tomato',
        disease: 'Healthy Leaf',
        confidence: 97.4,
        severity: 'None',
        description: 'The leaf appears healthy and shows normal chlorophyll levels. No pathogens detected during color analysis.',
        symptoms: ['Green vibrant coloration', 'Normal vein structure', 'No lesions or spots'],
        treatment: [
          'Maintain regular watering schedule.',
          'Apply nitrogen-rich fertilizer if growth is slow.',
          'Ensure proper soil aeration.'
        ],
        estimatedCost: '₹0',
        recommendedFertilizers: ['NPK 19-19-19 Premium Fertilizer'],
        recommendedPesticides: [],
        image: '/samples/healthy_leaf.png',
        createdAt: new Date()
      };
    } else if (type === 'rust') {
      sample = {
        _id: "sample_rust",
        cropName: 'Wheat',
        disease: 'Common Rust (Puccinia sorghi)',
        confidence: 93.8,
        severity: 'Medium',
        description: 'Common rust is caused by a fungus and appears as powdery orange-brown pustules on both upper and lower leaf surfaces.',
        symptoms: ['Pustules with rusty-orange spores', 'Yellowing of surrounding leaf tissue', 'Premature drying of leaf'],
        treatment: [
          'Apply copper-based fungicide or Mancozeb.',
          'Ensure adequate plant spacing to increase air circulation.',
          'Remove infected crop residue post-harvest.'
        ],
        estimatedCost: '₹450 - ₹950',
        recommendedFertilizers: ['NPK 19-19-19 Premium Fertilizer', 'Single Super Phosphate (SSP) Granular'],
        recommendedPesticides: ['Organic Neem Oil Pesticide (Cold Pressed)', 'Mancozeb Fungicide Premium'],
        image: '/samples/rust_leaf.png',
        createdAt: new Date()
      };
    } else if (type === 'blight') {
      sample = {
        _id: "sample_blight",
        cropName: 'Tomato',
        disease: 'Early Blight (Alternaria solani)',
        confidence: 89.2,
        severity: 'High',
        description: 'Blight is a highly destructive fungal disease characterized by dark brown/black lesions surrounded by yellow halos, rapidly leading to tissue decay.',
        symptoms: ['Target-like concentric ring spots', 'Dark water-soaked lesions on stems', 'Rapid defoliation'],
        treatment: [
          'Spray Chlorothalonil or Metalaxyl immediately.',
          'Prune lower leaves to improve airflow and prevent soil splash.',
          'Avoid overhead irrigation; water directly at the roots.'
        ],
        estimatedCost: '₹600 - ₹1500',
        recommendedFertilizers: ['Single Super Phosphate (SSP) Granular'],
        recommendedPesticides: ['Chlorothalonil Fungicide 75% WP', 'Organic Neem Oil Pesticide (Cold Pressed)'],
        image: '/samples/blight_leaf.png',
        createdAt: new Date()
      };
    }

    setActiveDiagnosis(sample);
    fetchNearbyShopkeepersSimulationFallback(sample);
    // Add to local history simulation
    setHistoryList(prev => [sample, ...prev]);

    voice.speakText(`${sample.cropName} diagnosis loaded. Disease: ${sample.disease}.`, 'en');
  };

  // Metrics
  const totalScansCount = historyList.length;
  const highSeverityCount = historyList.filter(h => h.severity === 'High').length;
  const healthyCount = historyList.filter(h => h.severity === 'None' || h.disease.toLowerCase().includes('healthy')).length;
  const healthyPercentage = totalScansCount > 0 ? Math.round((healthyCount / totalScansCount) * 100) : 0;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#050B07] text-[#E2E8F0] pb-12 font-sans relative">
      {/* Background radial gradient blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-950/25 to-transparent pointer-events-none"></div>

      {/* Header section (hidden on print) */}
      <header className="border-b border-emerald-900/40 bg-slate-950/30 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight">{t('cropHealthTitle')}</h1>
                <p className="text-[10px] text-slate-400 font-semibold">{t('cropHealthDesc').substring(0, 75)}...</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => voice.speakText(t('cropHealthDesc'), 'en')}
              className="text-[10px] bg-slate-900 border border-slate-800 hover:border-emerald-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" /> Help
            </button>
          </div>
        </div>
      </header>

      {/* Printable Report Layout (shown only during print) */}
      <div className="hidden print:block bg-white text-black p-8 font-serif">
        <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-emerald-800">AGRO-LINK AI CROP CLINIC</h1>
            <p className="text-xs text-gray-500 font-sans uppercase tracking-widest mt-0.5">Official Health Diagnostic & Treatment Report</p>
          </div>
          <div className="text-right text-xs text-gray-600 font-sans">
            <p><strong>Farmer ID:</strong> {user?._id || 'UID-8483'}</p>
            <p><strong>Report Date:</strong> {activeDiagnosis ? new Date(activeDiagnosis.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {activeDiagnosis ? (
          <div className="space-y-6">
            {/* Diagnosis Core */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-400 font-sans font-bold">Crop Diagnosed</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{activeDiagnosis.cropName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-sans font-bold">Disease Detected</p>
                <p className="text-base font-bold text-emerald-700 mt-0.5">{activeDiagnosis.disease}</p>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-sans font-bold">Severity</p>
                  <p className="text-base font-bold text-red-600 mt-0.5">{activeDiagnosis.severity}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400 font-sans font-bold">Confidence</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">{activeDiagnosis.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-emerald-800 mb-1.5">1. Pathology Analysis</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{activeDiagnosis.description}</p>
            </div>

            {/* Symptoms and Treatments */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-emerald-800 mb-2">2. Symptom Observations</h3>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1.5">
                  {activeDiagnosis.symptoms?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-emerald-800 mb-2">3. Recommended Treatments</h3>
                <ol className="list-decimal pl-5 text-xs text-gray-700 space-y-1.5">
                  {activeDiagnosis.treatment?.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Inputs & Cost */}
            <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-gray-500 mb-1.5">Recommended Fertilizers</h3>
                <div className="space-y-1 text-xs">
                  {activeDiagnosis.recommendedFertilizers?.map((f, idx) => (
                    <p key={idx} className="font-bold text-gray-800">✓ {f}</p>
                  )) || <p className="italic text-gray-400">None</p>}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-gray-500 mb-1.5">Recommended Pesticides</h3>
                <div className="space-y-1 text-xs">
                  {activeDiagnosis.recommendedPesticides?.map((p, idx) => (
                    <p key={idx} className="font-bold text-gray-800">✓ {p}</p>
                  )) || <p className="italic text-gray-400">None</p>}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-center">
                <p className="text-[10px] uppercase font-sans font-bold text-emerald-700">Estimated input cost</p>
                <p className="text-lg font-black text-emerald-900 mt-1">{activeDiagnosis.estimatedCost}</p>
              </div>
            </div>

            {/* QR/Signature */}
            <div className="border-t border-dashed border-slate-300 pt-8 mt-12 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-200 border border-slate-300 flex items-center justify-center text-[8px] text-gray-500 text-center uppercase">
                  QR CODE<br/>VERIFIED
                </div>
                <div className="text-[10px] text-gray-500">
                  <p>Certified by AGRO-LINK Agronomist Engine</p>
                  <p className="font-bold">Hash ID: {activeDiagnosis._id}</p>
                </div>
              </div>
              <div className="text-center font-sans text-xs text-gray-500">
                <div className="w-40 border-b border-gray-400 mx-auto h-8"></div>
                <p className="mt-1">Authorized Digital Signature</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 italic">No diagnostic data selected.</p>
        )}
      </div>

      {/* Main dashboard content (hidden on print) */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 print:hidden">
        {/* Error notification banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* 1. Global Stat Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/30 backdrop-blur-md border border-emerald-900/20 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-800/35 transition-all">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('totalScans')}</p>
              <h2 className="text-2xl font-black text-white mt-1">{totalScansCount}</h2>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          
          <div className="bg-slate-900/30 backdrop-blur-md border border-emerald-900/20 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-800/35 transition-all">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('highSeverityAlerts')}</p>
              <h2 className="text-2xl font-black text-red-500 mt-1">{highSeverityCount}</h2>
            </div>
            <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-md border border-emerald-900/20 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-800/35 transition-all">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('healthyScansRatio')}</p>
              <h2 className="text-2xl font-black text-emerald-400 mt-1">{healthyPercentage}%</h2>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </section>

        {/* 2. Upload Widget and Presets Dropdown */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Upload widget */}
          <div className="lg:col-span-7 bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-400" /> Upload Disease Image
            </h2>
            
            {/* Upload Area */}
            <div
              onClick={handleFileUploadClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/20 rounded-2xl py-8 px-4 text-center cursor-pointer group transition-all"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              
              <UploadCloud className="w-10 h-10 mx-auto text-slate-500 group-hover:text-emerald-400 transition-colors mb-2.5" />
              <p className="text-xs text-slate-300 font-bold">{t('aiDropzone')}</p>
              <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, JPEG (Compressed up to 20MB)</p>
            </div>

            {/* Presets Selection */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Try Curated Presets (Fast Sandbox):</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => loadPresetSample('healthy')}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 py-2 rounded-xl font-bold text-[10px] hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  Healthy Tomato Leaf
                </button>
                <button
                  onClick={() => loadPresetSample('rust')}
                  className="bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 text-amber-400 py-2 rounded-xl font-bold text-[10px] hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  Rust Corn/Wheat Leaf
                </button>
                <button
                  onClick={() => loadPresetSample('blight')}
                  className="bg-red-500/10 border border-red-500/20 hover:border-red-500 text-red-400 py-2 rounded-xl font-bold text-[10px] hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Blight Tomato Leaf
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Live Scanning Loader or active scan stats */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {isUploading ? (
              <div className="bg-slate-950/60 border border-emerald-950/40 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[250px]">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t('aiDetecting')}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Inspecting pixel pigment anomalies and chlorophyll ratio coefficients...</p>
                </div>
              </div>
            ) : activeDiagnosis ? (
              <div className="bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-4 flex gap-4 items-center">
                {activeDiagnosis.image ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                    <img 
                      src={activeDiagnosis.image} 
                      alt="Leaf scan preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Leaf className="w-8 h-8" />
                  </div>
                )}
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold uppercase truncate inline-block">
                    {activeDiagnosis.cropName}
                  </span>
                  <h3 className="text-sm font-black text-white truncate">{activeDiagnosis.disease}</h3>
                  <div className="flex gap-2.5 text-[10px] font-bold mt-1">
                    <span className="flex items-center gap-1">
                      {t('confidenceBadge')}: <strong className="text-emerald-400">{activeDiagnosis.confidence}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      {t('severityBadge')}: 
                      <strong className={`px-1.5 py-0.25 rounded text-[8px] uppercase ${
                        activeDiagnosis.severity === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        activeDiagnosis.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        activeDiagnosis.severity === 'Low' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {activeDiagnosis.severity}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 text-center italic text-xs text-slate-500 py-16">
                Upload a crop photo or choose a sample to execute AI diagnostics.
              </div>
            )}
          </div>
        </section>

        {/* 3. Detailed Results and Shopkeepers Integration */}
        {activeDiagnosis && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left detailed diagnostic columns */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-emerald-400" /> Diagnosis Cures & Recipes
                </h2>
                <button
                  onClick={handlePrint}
                  className="text-[10px] bg-slate-900 border border-slate-800 hover:border-emerald-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> {t('printReportBtn')}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">{activeDiagnosis.description}</p>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-900">
                <button
                  onClick={() => setActiveTab('symptoms')}
                  className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                    activeTab === 'symptoms' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t('symptomsLabel')}
                </button>
                <button
                  onClick={() => setActiveTab('treatments')}
                  className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                    activeTab === 'treatments' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t('treatmentLabel')}
                </button>
                <button
                  onClick={() => setActiveTab('inputs')}
                  className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                    activeTab === 'inputs' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Agricultural Inputs
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[140px] pt-1">
                {activeTab === 'symptoms' && (
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {activeDiagnosis.symptoms?.map((symptom, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'treatments' && (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    {activeDiagnosis.treatment?.map((treat, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="w-5 h-5 bg-emerald-950/40 border border-emerald-900/35 rounded-full flex items-center justify-center font-bold text-[10px] text-emerald-400 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{treat}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {activeTab === 'inputs' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/20 border border-slate-800 p-3 rounded-xl">
                        <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">{t('fertilizersLabel')}</p>
                        <div className="space-y-1.5 mt-2">
                          {activeDiagnosis.recommendedFertilizers?.map((f, idx) => (
                            <div key={idx} className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {f}
                            </div>
                          )) || <p className="text-[10px] text-slate-600 italic">None</p>}
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/20 border border-slate-800 p-3 rounded-xl">
                        <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">{t('pesticidesLabel')}</p>
                        <div className="space-y-1.5 mt-2">
                          {activeDiagnosis.recommendedPesticides?.map((p, idx) => (
                            <div key={idx} className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> {p}
                            </div>
                          )) || <p className="text-[10px] text-slate-600 italic">None</p>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-950/15 border border-emerald-900/30 p-3.5 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{t('costLabel')}</span>
                      <strong className="text-emerald-400 text-sm font-black">{activeDiagnosis.estimatedCost}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right commerce panel: Nearby Shopkeepers selling required products */}
            <div className="lg:col-span-5 bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-5 space-y-4 flex flex-col justify-between text-left">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-900 pb-3">
                  <ShoppingBag className="w-4.5 h-4.5 text-emerald-400" /> {t('nearbyShopsLabel')}
                </h2>
                
                {/* Shop Products Listing */}
                <div className="space-y-3.5 mt-4 max-h-[310px] overflow-y-auto pr-1">
                  {nearbyProducts.length > 0 ? (
                    nearbyProducts.map((prod) => (
                      <div 
                        key={prod._id}
                        className={`p-3 rounded-2xl border transition-all hover:border-emerald-600/35 relative overflow-hidden ${
                          prod.isMatch 
                            ? 'bg-emerald-950/10 border-emerald-500/20' 
                            : 'bg-slate-900/20 border-slate-800'
                        }`}
                      >
                        {prod.isMatch && (
                          <span className="absolute top-0 right-0 bg-emerald-500 text-[#050B07] text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Match
                          </span>
                        )}
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">{prod.name}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1 font-semibold">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              {prod.shopkeeper.name} ({prod.shopkeeper.rating})
                            </span>
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <MapPin className="w-3 h-3" /> {prod.distanceKm} km
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-end mt-2 pt-1 border-t border-slate-900/40">
                            <div>
                              <p className="text-[9px] text-slate-500">Shopkeeper Price</p>
                              <strong className="text-white text-xs font-extrabold">₹{prod.price}</strong>
                            </div>
                            <button
                              onClick={() => handleOpenBuyModal(prod)}
                              className="btn-primary py-1 px-3.5 rounded-lg text-[9px] font-black cursor-pointer"
                            >
                              {t('buyNowInputBtn')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 italic text-[11px] py-8">
                      No nearby shops inventory found matching recommendations.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Dashboard Charts Visualizer */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SeverityTimelineChart history={historyList} />
          <DiseaseOccurrencesChart history={historyList} />
        </section>

        {/* 5. Historical Scan Logs */}
        <section className="bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-5 space-y-4 text-left">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-900 pb-3">
            <Calendar className="w-4.5 h-4.5 text-emerald-400" /> {t('healthHistoryTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {historyList.length > 0 ? (
              historyList.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => {
                    setActiveDiagnosis(item);
                    fetchNearbyShopkeepersSimulationFallback(item);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 text-left relative group ${
                    activeDiagnosis?._id === item._id 
                      ? 'bg-emerald-950/20 border-emerald-500/45 shadow-lg shadow-emerald-900/5' 
                      : 'bg-slate-900/10 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Leaf Thumbnail */}
                  {item.image ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                      <img 
                        src={item.image} 
                        alt="Crop leaf thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-950/20 border border-emerald-900/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Leaf className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h4 className="text-xs font-extrabold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {item.disease}
                    </h4>
                    <div className="flex gap-2 text-[9px] text-slate-400 font-semibold items-center">
                      <span>{item.cropName}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.25 rounded-[4px] uppercase text-[7px] font-bold ${
                        item.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                        item.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                        item.severity === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteHistory(item._id, e)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-red-400 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500 italic text-xs">
                {t('healthHistoryEmpty')}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 6. Buy Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-950 border border-slate-800/80 max-w-sm w-full rounded-3xl p-5 shadow-2xl space-y-4 text-left animate-in fade-in duration-300">
            <div>
              <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold uppercase inline-block">
                Confirm Input Order
              </span>
              <h3 className="text-sm font-black text-white mt-1.5">{selectedProduct.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{selectedProduct.description}</p>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">{selectedProduct.shopkeeper.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Unit Price:</span>
                <span className="font-bold text-emerald-400">₹{selectedProduct.price}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">In Stock:</span>
                <span className="font-bold text-slate-300">{selectedProduct.quantityInStock} Units</span>
              </div>
            </div>

            {orderSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-400 text-xs font-bold text-center animate-pulse">
                {orderSuccess}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400">Order Quantity:</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPurchaseQty(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 bg-slate-900 border border-slate-800 hover:border-emerald-600 rounded flex items-center justify-center text-slate-300 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-extrabold text-white text-xs">{purchaseQty}</span>
                    <button
                      onClick={() => setPurchaseQty(prev => Math.min(selectedProduct.quantityInStock, prev + 1))}
                      className="w-7 h-7 bg-slate-900 border border-slate-800 hover:border-emerald-600 rounded flex items-center justify-center text-slate-300 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                  <span className="text-xs text-slate-400 font-bold">Total Payout:</span>
                  <strong className="text-emerald-400 text-sm font-black">₹{selectedProduct.price * purchaseQty}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isBuying || selectedProduct.quantityInStock === 0}
                    className="btn-primary py-2.5 rounded-xl font-black text-xs cursor-pointer text-center"
                  >
                    {isBuying ? 'Processing...' : 'Confirm Buy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropHealth;
