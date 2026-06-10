import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { io } from 'socket.io-client';
import { 
  MessageSquare, User, Check, X, ShieldCheck, 
  Send, Hammer, RefreshCcw, DollarSign, ShieldAlert, AlertTriangle, ChevronRight, Activity, Sparkles
} from 'lucide-react';

const NegotiationChat = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [offerBid, setOfferBid] = useState('');

  // AI Contract Terms Auditor State
  const [contractAnalysis, setContractAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Fetch all orders
  const fetchMyOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/orders/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        if (data.orders.length > 0 && !selectedOrder) {
          loadOrderDetails(data.orders[0]._id);
        }
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
  };

  // Fetch chat history for selected order
  const loadOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/marketplace/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setMessages(data.messages);

        // Connect socket for real-time chat
        initializeSocket(orderId);
      }
    } catch (err) {
      console.error('Load order details error:', err);
    }
  };

  // Initialize Socket pipeline
  const initializeSocket = (orderId) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to backend socket server
    const socket = io('http://localhost:8000');
    socketRef.current = socket;

    socket.emit('join_room', { orderId });

    // Listen for incoming messages
    socket.on('receive_message', (chatMessage) => {
      setMessages((prev) => [...prev, chatMessage]);
    });

    // Listen for live price negotiation changes
    socket.on('order_updated', (updatedFields) => {
      setSelectedOrder((prev) => {
        if (!prev) return null;
        return { ...prev, ...updatedFields };
      });
      // Refresh order list sidebar
      fetchMyOrders();
    });
  };

  useEffect(() => {
    if (token) {
      fetchMyOrders();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time AI contract analyzer trigger
  useEffect(() => {
    if (!selectedOrder) {
      setContractAnalysis(null);
      return;
    }

    const runContractAnalysis = async () => {
      setAnalysisLoading(true);
      const cropName = selectedOrder.produce ? selectedOrder.produce.cropName : selectedOrder.product?.name;
      const price = selectedOrder.negotiationPrice || selectedOrder.price;
      const quantity = selectedOrder.quantity;
      const timelineDays = 8; // standard assumed logistics window

      try {
        const response = await fetch('http://localhost:5000/api/ai/analyze-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cropName,
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            timelineDays
          })
        });
        const data = await response.json();
        if (data.success) {
          setContractAnalysis(data);
          setAnalysisLoading(false);
          return;
        }
      } catch (err) {
        console.warn('AI Contract Analyser Offline. Loading local fallback...', err);
      }

      // Local fallback calculation
      const crop_bases = {
        'Wheat': 22.0, 'Rice': 65.0, 'Tomato': 18.0, 'Potato': 15.0, 'Cotton': 60.0, 'Soybean': 42.0
      };
      const base = crop_bases[cropName] || 20.0;
      const deviation = ((price - base) / base) * 100;
      
      let score = 30;
      const warnings = [];
      const recs = [];

      if (deviation < -10) {
        score += 25;
        warnings.push(`Price is undervalued (₹${price}/kg is ${Math.abs(Math.round(deviation))}% below market average).`);
        recs.push(`Request a higher rate of ₹${Math.round(base * 0.95)}/kg.`);
      } else if (deviation > 15) {
        warnings.push("High-value bid. Confirm strict moisture delivery thresholds.");
        recs.push("Secure standard legal escrow structure.");
      } else {
        recs.push("Fair market trade boundaries are optimal.");
      }

      // Timeline mock buffer
      score += 15;
      warnings.push("Standard 8-day delivery buffer has moderate transit rain delays risk.");
      recs.push("Request a 10-day transportation window or rain force majeure clause.");

      if (quantity > 4000) {
        score += 10;
        warnings.push("High volume contract default risks.");
        recs.push("Request fractional delivery clauses.");
      }

      const rating = score > 60 ? "Danger (High Risk)" : score > 35 ? "Caution (Medium Risk)" : "Safe";

      setContractAnalysis({
        crop: cropName,
        offeredPrice: price,
        fairPriceAverage: base,
        valuationPercentage: Math.round(deviation * 100) / 100,
        riskScore: score,
        riskRating: rating,
        warnings,
        recommendations: recs
      });
      setAnalysisLoading(false);
    };

    runContractAnalysis();
  }, [selectedOrder, selectedOrder?.negotiationPrice, selectedOrder?.status]);

  // Handle standard message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedOrder) return;

    const receiverId = user.id === selectedOrder.buyer._id 
      ? selectedOrder.seller._id 
      : selectedOrder.buyer._id;

    socketRef.current.emit('send_message', {
      orderId: selectedOrder._id,
      senderId: user.id,
      receiverId,
      message: inputText,
      isOffer: false
    });

    setInputText('');
  };

  // Handle submitting negotiation price offer (Dealer only)
  const handleSendOffer = (e) => {
    e.preventDefault();
    if (!offerBid || isNaN(offerBid) || !selectedOrder) return;

    const receiverId = user.id === selectedOrder.buyer._id 
      ? selectedOrder.seller._id 
      : selectedOrder.buyer._id;

    socketRef.current.emit('send_message', {
      orderId: selectedOrder._id,
      senderId: user.id,
      receiverId,
      message: `Placed a new negotiation bid offer: ₹${offerBid}/kg`,
      offerPrice: parseFloat(offerBid),
      isOffer: true
    });

    setOfferBid('');
  };

  // Handle accepting price offer (Farmer only)
  const handleAcceptOffer = () => {
    if (!selectedOrder || !selectedOrder.negotiationPrice) return;
    
    socketRef.current.emit('accept_offer', {
      orderId: selectedOrder._id,
      finalPrice: selectedOrder.negotiationPrice
    });
  };

  // Handle rejecting price offer (Farmer only)
  const handleRejectOffer = () => {
    if (!selectedOrder) return;
    
    socketRef.current.emit('reject_offer', {
      orderId: selectedOrder._id
    });
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col h-screen">
      {/* Navbar */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        <div className="flex gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="hover:text-emerald-400 transition-colors">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/chat" className="text-emerald-400 hover:text-emerald-300">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>
      </nav>

      {/* Main chatroom layout */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-6 gap-6">
        
        {/* Left Sidebar: Active Orders */}
        <div className="w-1/4 glass-panel p-4 flex flex-col gap-3 overflow-y-auto flex-shrink-0">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2">
            Active Negotiations ({orders.length})
          </h2>

          <div className="space-y-2 flex-1">
            {orders.length > 0 ? (
              orders.map((ord) => {
                const isSelected = selectedOrder?._id === ord._id;
                const cropName = ord.produce ? ord.produce.cropName : ord.product?.name;
                const isNegotiating = ord.status === 'In Negotiation';

                return (
                  <button
                    key={ord._id}
                    onClick={() => loadOrderDetails(ord._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-emerald-500/25 border-emerald-400/60 shadow shadow-emerald-500/10' 
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-white">
                      <span>{cropName}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                        ord.status === 'Approved' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : isNegotiating
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Qty: {ord.quantity} kg</span>
                      <span>Price: ₹{ord.price}/kg</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">
                No active orders or bids found.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Stream */}
        <div className="flex-1 glass-panel flex flex-col overflow-hidden">
          
          {selectedOrder ? (
            <>
              {/* Header: Order info */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedOrder.produce ? selectedOrder.produce.cropName : selectedOrder.product?.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Order Ref: #{selectedOrder._id.slice(-6).toUpperCase()} | Seller: {selectedOrder.seller.name}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400">Total Price Value:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* --- ACTIVE BID NEGO BAR --- */}
              {selectedOrder.type === 'produce' && (
                <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-slate-400 font-semibold">{t('chatActiveOffer')}:</p>
                      <p className="font-extrabold text-sm text-slate-100">
                        {selectedOrder.negotiationPrice ? `₹${selectedOrder.negotiationPrice}/kg` : 'No active bids'}
                      </p>
                    </div>
                  </div>

                  {/* Render Accept/Reject only on Seller side if bid is pending */}
                  {user.id === selectedOrder.seller._id ? (
                    selectedOrder.negotiationPrice ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleRejectOffer}
                          className="px-3.5 py-1.5 rounded-lg bg-red-950/30 border border-red-900/55 text-red-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-red-900/20"
                        >
                          <X className="w-3.5 h-3.5" />
                          {t('chatRejectBtn')}
                        </button>
                        <button
                          onClick={handleAcceptOffer}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t('chatAcceptBtn')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Waiting for buyer bid offers...</span>
                    )
                  ) : (
                    // Buyer bidding input panel
                    selectedOrder.status !== 'Approved' && (
                      <form onSubmit={handleSendOffer} className="flex gap-2 items-center">
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="number"
                            required
                            placeholder="Enter bid (₹/kg)"
                            value={offerBid}
                            onChange={(e) => setOfferBid(e.target.value)}
                            className="glass-input py-1.5 pl-7 pr-2 text-[10px] w-36"
                          />
                        </div>
                        <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer">
                          {t('chatSendBtn')}
                        </button>
                      </form>
                    )
                  )}

                  {selectedOrder.status === 'Approved' && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/40 py-1.5 px-3 rounded-lg text-[10px]">
                      <ShieldCheck className="w-4 h-4" />
                      Deal Closed & Approved
                    </div>
                  )}
                </div>
              )}

              {/* Chat Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender === user.id;
                  
                  // Format bid status display
                  if (msg.isOffer) {
                    const isAccepted = msg.offerStatus === 'Accepted';
                    const isRejected = msg.offerStatus === 'Rejected';

                    return (
                      <div key={msg._id} className="flex justify-center my-4 animate-fade-in">
                        <div className={`p-4 rounded-xl border text-xs max-w-sm text-center space-y-2 ${
                          isAccepted 
                            ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-300' 
                            : isRejected 
                            ? 'bg-red-950/25 border-red-500/30 text-red-300'
                            : 'bg-amber-950/25 border-amber-500/40 text-amber-300'
                        }`}>
                          <p className="font-bold flex items-center justify-center gap-1">
                            <Hammer className="w-4 h-4" />
                            {msg.message}
                          </p>
                          <div className="text-[10px] opacity-75 font-semibold">
                            Status: {msg.offerStatus}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`flex gap-2.5 max-w-md ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="bg-slate-800 p-2.5 rounded-full flex-shrink-0 border border-slate-700 h-9 w-9 flex items-center justify-center text-slate-300">
                          <User className="w-4 h-4" />
                        </div>
                        
                        <div className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                          isMe 
                            ? 'bg-emerald-500 text-white rounded-tr-none font-semibold' 
                            : 'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-none leading-relaxed'
                        }`}>
                          <p>{msg.message}</p>
                          <span className="text-[9px] block opacity-60 text-right font-bold">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Message inputs */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/10 flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="glass-input flex-1 py-3 text-xs"
                  disabled={selectedOrder.status === 'Approved'}
                />
                <button
                  type="submit"
                  className="btn-primary p-3 rounded-xl flex items-center justify-center cursor-pointer"
                  disabled={selectedOrder.status === 'Approved'}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic p-10">
              No negotiations active. Browse crops or tools in the marketplace to make bid offers!
            </div>
          )}

        </div>

        {/* AI Deal Auditor Sidebar */}
        <div className="w-1/4 glass-panel p-5 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse-slow" />
            AI Deal Auditor
          </h2>

          {analysisLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] text-slate-400 font-bold">Auditing pricing valuation & timeline clauses...</p>
            </div>
          ) : contractAnalysis ? (
            <div className="space-y-4 text-xs font-semibold animate-fade-in">
              {/* Risk Level gauge */}
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Deal Safety Audit</span>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black ${
                    contractAnalysis.riskRating.includes("Danger") 
                      ? 'text-red-400' 
                      : contractAnalysis.riskRating.includes("Caution")
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {contractAnalysis.riskRating}
                  </span>
                  <span className="font-extrabold text-white text-xs">{contractAnalysis.riskScore}/100</span>
                </div>

                {/* Micro gauge bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      contractAnalysis.riskScore > 60 ? 'bg-red-500' : contractAnalysis.riskScore > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${contractAnalysis.riskScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Valuation details */}
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Valuation Benchmark</span>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Offered Base:</span>
                  <span className="text-slate-200 font-bold">₹{contractAnalysis.offeredPrice}/kg</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Market Fair Average:</span>
                  <span className="text-slate-200 font-bold">₹{contractAnalysis.fairPriceAverage}/kg</span>
                </div>
                <div className="flex justify-between text-[10px] border-t border-slate-800/80 pt-1.5">
                  <span className="text-slate-400">Price Deviation:</span>
                  <span className={`font-black ${
                    contractAnalysis.valuationPercentage < -10 
                      ? 'text-red-400' 
                      : contractAnalysis.valuationPercentage > 15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {contractAnalysis.valuationPercentage > 0 ? '+' : ''}{contractAnalysis.valuationPercentage}%
                  </span>
                </div>
              </div>

              {/* Warnings List */}
              <div className="space-y-2">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Warning Clauses
                </span>
                <ul className="space-y-1.5">
                  {contractAnalysis.warnings.map((w, idx) => (
                    <li key={idx} className="bg-red-950/10 border border-red-950/30 text-red-300 p-2.5 rounded-lg text-[10px] leading-relaxed flex gap-1.5 items-start">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations List */}
              <div className="space-y-2">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Strategic Advisory
                </span>
                <ul className="space-y-1.5">
                  {contractAnalysis.recommendations.map((r, idx) => (
                    <li key={idx} className="bg-emerald-950/10 border border-emerald-950/30 text-emerald-300 p-2.5 rounded-lg text-[10px] leading-relaxed flex gap-1.5 items-start">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Link to Full Negotiation Assistant */}
              <div className="pt-3 border-t border-slate-800/80">
                <Link
                  to="/negotiation-assistant"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-350 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  Launch Negotiation Assistant
                </Link>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-[10px] italic">
              Select an active bidding room negotiation to load AI terms auditor advice.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NegotiationChat;
