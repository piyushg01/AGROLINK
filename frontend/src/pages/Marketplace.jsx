import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShoppingBag, PlusCircle, MapPin, Tag, Box, 
  Search, ArrowRight, Star, Compass, Info, Check,
  Sparkles, UploadCloud
} from 'lucide-react';

const Marketplace = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('produce'); // produce, products, upload
  
  // Lists
  const [produceList, setProduceList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Upload Form States (Produce)
  const [cropName, setCropName] = useState('');
  const [cropCategory, setCropCategory] = useState('Grain');
  const [quantity, setQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [produceDesc, setProduceDesc] = useState('');
  const [produceImage, setProduceImage] = useState('');
  const [detectedQuality, setDetectedQuality] = useState('');
  const [detectedGrade, setDetectedGrade] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [aiVerified, setAiVerified] = useState(false);
  const [isAnalyzingListing, setIsAnalyzingListing] = useState(false);
  const [aiError, setAiError] = useState('');

  // Upload Form States (Product)
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Fertilizer');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');

  // General Notification
  const [notification, setNotification] = useState('');

  // Fetch produce and products
  const fetchMarketplaceData = async () => {
    try {
      const prodRes = await fetch(`http://localhost:8000/api/marketplace/produce/all?category=${categoryFilter}&search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if (prodData.success) setProduceList(prodData.produce);

      const itemsRes = await fetch(`http://localhost:8000/api/marketplace/products/all?category=${categoryFilter}&search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const itemsData = await itemsRes.json();
      if (itemsData.success) setProductList(itemsData.products);
    } catch (err) {
      console.error('Marketplace fetch error:', err);
    }
  };

  // Fetch nearby shopkeepers via geolocation
  const fetchNearbyShops = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/marketplace/nearby-shopkeepers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNearbyShops(data.shopkeepers);
      }
    } catch (err) {
      console.error('Nearby shops fetch error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMarketplaceData();
      fetchNearbyShops();
    }
  }, [token, searchQuery, categoryFilter, activeTab]);

  // Handle Base64 file reader conversion
  const handleImageConversion = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAutoListingScan = async (base64Img) => {
    setIsAnalyzingListing(true);
    setAiError('');
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/produce/analyze-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: base64Img })
      });
      const data = await response.json();
      if (data.success) {
        setCropName(data.cropName);
        setCropCategory(data.category);
        setPricePerKg(data.suggestedPrice.toString());
        setProduceDesc(data.description);
        setDetectedQuality(data.detectedQuality);
        setDetectedGrade(data.detectedGrade);
        setSuggestedPrice(data.suggestedPrice);
        setAiVerified(true);
        setProduceImage(base64Img);
      } else {
        setAiError(data.error || 'AI analysis failed.');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setAiError('Failed to communicate with AI analysis service.');
    } finally {
      setIsAnalyzingListing(false);
    }
  };

  const handleAutoListingFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAutoListingScan(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload crop listing
  const handleUploadProduce = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cropName,
          category: cropCategory,
          quantity: parseFloat(quantity),
          pricePerKg: parseFloat(pricePerKg),
          description: produceDesc,
          image: produceImage,
          address: user.address,
          coordinates: user.location,
          detectedQuality,
          detectedGrade,
          suggestedPrice,
          aiVerified
        })
      });
      const data = await response.json();
      if (data.success) {
        setNotification('Produce listed successfully!');
        // Clear fields
        setCropName('');
        setQuantity('');
        setPricePerKg('');
        setProduceDesc('');
        setProduceImage('');
        setDetectedQuality('');
        setDetectedGrade('');
        setSuggestedPrice(0);
        setAiVerified(false);
        setActiveTab('produce');
      }
    } catch (err) {
      console.error('Upload produce error:', err);
    }
  };

  // Handle upload product listing
  const handleUploadProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/marketplace/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          category: prodCategory,
          price: parseFloat(prodPrice),
          quantityInStock: parseFloat(prodStock),
          description: prodDesc,
          image: prodImage
        })
      });
      const data = await response.json();
      if (data.success) {
        setNotification('Agricultural product listed successfully!');
        setProdName('');
        setProdPrice('');
        setProdStock('');
        setProdDesc('');
        setProdImage('');
        setActiveTab('products');
      }
    } catch (err) {
      console.error('Upload product error:', err);
    }
  };

  // Place Order / Bidding Request
  const handlePlaceOrder = async (itemId, type, originalPrice, isNegotiating) => {
    try {
      let initialOfferPrice = null;
      if (isNegotiating) {
        const bidStr = prompt(`Enter your negotiation price offer per kg (Original base: ₹${originalPrice}/kg):`);
        if (!bidStr || isNaN(bidStr)) return;
        initialOfferPrice = parseFloat(bidStr);
      }

      const response = await fetch('http://localhost:8000/api/marketplace/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId,
          type,
          quantity: 1, // Defaulting to 1 for basic click-checkout, can scale up
          initialOfferPrice
        })
      });
      const data = await response.json();
      if (data.success) {
        setNotification(t('orderPlaced'));
        setTimeout(() => navigate('/chat'), 1500);
      }
    } catch (err) {
      console.error('Order placing error:', err);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header section */}
      <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-agrolink-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-xl tracking-tight text-white">{t('appName')}</span>
        </div>
        <div className="flex gap-6 text-sm font-semibold text-slate-300">
          <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('navHome')}</Link>
          <Link to="/marketplace" className="text-emerald-400 hover:text-emerald-300">{t('navMarketplace')}</Link>
          <Link to="/ai-hub" className="hover:text-emerald-400 transition-colors">{t('navAiHub')}</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition-colors">{t('navChat')}</Link>
          <Link to="/ai-copilot" className="hover:text-emerald-400 transition-colors">{t('navCopilot')}</Link>
        </div>
      </nav>

      {/* Main Area */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Banner Notification */}
        {notification && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-bold">{notification}</p>
          </div>
        )}

        {/* Section selectors */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('produce')}
              className={`py-2.5 px-5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'produce' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('marketCropCatalog')}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2.5 px-5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('marketShopCatalog')}
            </button>
            
            {/* Conditional upload tab based on user's role */}
            {user?.role !== 'dealer' && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2.5 px-5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                {user?.role === 'farmer' ? t('marketUploadProduce') : t('marketUploadProduct')}
              </button>
            )}
          </div>

          {/* Catalog search query filter */}
          {activeTab !== 'upload' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-9 py-2 text-xs w-48 focus:w-64"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input py-2 text-xs focus:ring-0 cursor-pointer"
              >
                <option value="">All Categories</option>
                {activeTab === 'produce' ? (
                  <>
                    <option value="Grain">Grains</option>
                    <option value="Vegetable">Vegetables</option>
                    <option value="Fruit">Fruits</option>
                    <option value="Pulses">Pulses</option>
                  </>
                ) : (
                  <>
                    <option value="Fertilizer">Fertilizers</option>
                    <option value="Pesticide">Pesticides</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Tools">Tools</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* --- GEOLOCATION SHOPKEEPER RECOMMENDATIONS (only show on crops catalog) --- */}
        {activeTab === 'produce' && nearbyShops.length > 0 && (
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide uppercase">
              <Compass className="w-4 h-4 text-amber-400 animate-spin" />
              {t('nearbyShops')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nearbyShops.slice(0, 3).map((shop, idx) => (
                <div key={shop._id} className="gold-panel p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-xs font-bold text-white">{shop.name}</h4>
                      <span className="bg-emerald-500/10 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {shop.address}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Phone: {shop.phone}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('products')} 
                    className="text-[10px] text-amber-300 font-extrabold flex items-center gap-1.5 mt-3 hover:underline text-left cursor-pointer"
                  >
                    {t('nearbyBuy')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: CROPS MARKETPLACE --- */}
        {activeTab === 'produce' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {produceList.length > 0 ? (
              produceList.map((crop) => (
                <div key={crop._id} className="glass-panel overflow-hidden flex flex-col justify-between hover:scale-[1.01] relative">
                  {crop.aiVerified && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 shadow-lg z-10 border border-emerald-400/30">
                      <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                      {t('aiVerifiedBadge')}
                    </div>
                  )}
                  {crop.image ? (
                    <img src={crop.image} alt={crop.cropName} className="w-full h-40 object-cover border-b border-slate-800" />
                  ) : (
                    <div className="w-full h-40 bg-emerald-950/10 flex items-center justify-center border-b border-slate-800 text-emerald-500 text-xs">
                      No Image Available
                    </div>
                  )}
                  
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-sm">{crop.cropName}</h3>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {crop.category}
                        </span>
                      </div>
                      
                      {(crop.detectedGrade || crop.detectedQuality) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {crop.detectedGrade && (
                            <span className="bg-amber-500/15 text-amber-300 text-[8.5px] px-1.5 py-0.5 rounded font-extrabold border border-amber-500/30">
                              {crop.detectedGrade}
                            </span>
                          )}
                          {crop.detectedQuality && (
                            <span className="bg-emerald-500/15 text-emerald-300 text-[8.5px] px-1.5 py-0.5 rounded font-extrabold border border-emerald-500/30 truncate max-w-[120px]" title={crop.detectedQuality}>
                              {crop.detectedQuality.split(' (')[0]}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{crop.description}</p>
                    </div>

                    <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Available Qty:</span>
                        <span className="font-bold text-white">{crop.quantity} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Price:</span>
                        <span className="font-extrabold text-emerald-400">₹{crop.pricePerKg}/kg</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1 text-slate-500 font-semibold border-t border-slate-800/60">
                        <span>Seller: {crop.farmer?.name}</span>
                        <span>Pin: {crop.address.split(',')[0]}</span>
                      </div>
                    </div>

                    {user?.role === 'dealer' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handlePlaceOrder(crop._id, 'produce', crop.pricePerKg, true)}
                          className="btn-secondary py-2 px-1 text-[10px] text-center font-bold flex items-center justify-center cursor-pointer"
                        >
                          {t('makeOfferBtn')}
                        </button>
                        <button
                          onClick={() => handlePlaceOrder(crop._id, 'produce', crop.pricePerKg, false)}
                          className="btn-primary py-2 px-1 text-[10px] text-center font-bold flex items-center justify-center cursor-pointer"
                        >
                          {t('buyNowBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 py-12 text-center text-slate-400 text-sm">
                No crops listed in this category yet.
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: AGRICULTURAL PRODUCTS MARKETPLACE --- */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {productList.length > 0 ? (
              productList.map((item) => (
                <div key={item._id} className="glass-panel overflow-hidden flex flex-col justify-between hover:scale-[1.01]">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover border-b border-slate-800" />
                  ) : (
                    <div className="w-full h-40 bg-amber-950/10 flex items-center justify-center border-b border-slate-800 text-amber-500 text-xs">
                      No Image Available
                    </div>
                  )}

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-sm">{item.name}</h3>
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stock Status:</span>
                        <span className="font-bold text-white">{item.quantityInStock} left</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price:</span>
                        <span className="font-extrabold text-amber-400">₹{item.price}</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1 text-slate-500 font-semibold border-t border-slate-800/60">
                        <span>Shop: {item.shopkeeper?.name}</span>
                      </div>
                    </div>

                    {user?.role === 'farmer' && (
                      <button
                        onClick={() => handlePlaceOrder(item._id, 'product', item.price, false)}
                        className="btn-primary w-full py-2.5 text-xs text-center font-bold flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                      >
                        Buy Product
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 py-12 text-center text-slate-400 text-sm">
                No agricultural products listed in this category yet.
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: UPLOAD LISTING VIEW --- */}
        {activeTab === 'upload' && (
          <div className="max-w-xl mx-auto glass-panel p-8">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              {user?.role === 'farmer' ? t('marketUploadProduce') : t('marketUploadProduct')}
            </h2>

            {/* Farmer produce upload form */}
            {user?.role === 'farmer' ? (
              <div className="space-y-6">
                
                {/* AI Auto-Listing Scanner */}
                <div className="glass-panel p-5 border border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <h3 className="font-extrabold text-sm text-emerald-300 tracking-wide uppercase">{t('aiListingHeader')}</h3>
                    </div>
                    {aiVerified && (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/40">
                        <Check className="w-3 h-3 text-emerald-400" /> {t('aiVerifiedBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    {t('aiListingDesc')}
                  </p>

                  <div className="relative border border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-6 transition-all duration-300 bg-slate-900/40 text-center flex flex-col items-center justify-center cursor-pointer min-h-[140px]">
                    <input
                      type="file"
                      accept="image/*"
                      id="ai-listing-file"
                      onChange={handleAutoListingFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {isAnalyzingListing ? (
                      <div className="space-y-3 flex flex-col items-center relative z-20">
                        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-emerald-300 animate-pulse">{t('aiScanning')}</span>
                        {/* Laser Scan Animation Line */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-bounce"></div>
                      </div>
                    ) : produceImage && aiVerified ? (
                      <div className="flex items-center gap-4 relative z-20 w-full">
                        <img src={produceImage} alt="Crop Scan" className="w-20 h-20 object-cover rounded-lg border border-slate-800" />
                        <div className="text-left space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">{cropName}</span>
                            <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold">{detectedGrade}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{detectedQuality}</p>
                          <p className="text-xs font-bold text-emerald-400">{t('aiSuggestedPrice')}: ₹{suggestedPrice}/kg</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 hover:text-white transition-all cursor-pointer">
                          Scan Another
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2 relative z-20">
                        <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-300">Click or drag crop/leaf image to auto-fill</p>
                        <p className="text-[9px] text-slate-500 font-semibold">Supports PNG, JPG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                  
                  {aiError && (
                    <p className="text-red-400 font-bold text-[10px] bg-red-950/20 border border-red-500/30 p-2 rounded-lg">{aiError}</p>
                  )}
                </div>

                <form onSubmit={handleUploadProduce} className="space-y-4 text-xs font-semibold text-slate-300">
                  <div className="flex flex-col gap-1.5">
                    <label>{t('marketCropName')}</label>
                    <input
                      type="text"
                      required
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder="Premium Basmati Rice / Alphonso Mango"
                      className="glass-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label>{t('marketCategory')}</label>
                      <select
                        value={cropCategory}
                        onChange={(e) => setCropCategory(e.target.value)}
                        className="glass-input w-full cursor-pointer"
                      >
                        <option value="Grain">Grain</option>
                        <option value="Vegetable">Vegetable</option>
                        <option value="Fruit">Fruit</option>
                        <option value="Pulses">Pulses</option>
                        <option value="Oilseeds">Oilseeds</option>
                        <option value="Spice">Spice</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label>{t('marketQuantity')}</label>
                      <input
                        type="number"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="500"
                        className="glass-input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label>{t('marketPrice')}</label>
                    <input
                      type="number"
                      required
                      value={pricePerKg}
                      onChange={(e) => setPricePerKg(e.target.value)}
                      placeholder="65"
                      className="glass-input w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label>{t('marketDesc')}</label>
                    <textarea
                      required
                      rows="3"
                      value={produceDesc}
                      onChange={(e) => setProduceDesc(e.target.value)}
                      placeholder="Freshly harvested, organic, grade-A moisture content under 12%."
                      className="glass-input w-full resize-none"
                    ></textarea>
                  </div>

                  {aiVerified && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold mb-0.5">AI Detected Grade</span>
                        <span className="text-xs font-bold text-amber-300">{detectedGrade}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold mb-0.5">AI Quality Rating</span>
                        <span className="text-[11px] font-bold text-emerald-400 truncate block">{detectedQuality.split(' (')[0]}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label>Crop Photo (Upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageConversion(e, setProduceImage)}
                      className="glass-input w-full cursor-pointer"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full mt-4 cursor-pointer text-sm">
                    {t('marketUploadBtn')}
                  </button>
                </form>
              </div>
            ) : (
              // Shopkeeper product upload form
              <form onSubmit={handleUploadProduct} className="space-y-4 text-xs font-semibold text-slate-300">
                <div className="flex flex-col gap-1.5">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="NPK 19-19-19 Organic Fertilizer"
                    className="glass-input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label>Category</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="glass-input w-full cursor-pointer"
                    >
                      <option value="Fertilizer">Fertilizer</option>
                      <option value="Pesticide">Pesticide</option>
                      <option value="Seeds">Seeds</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label>Product Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="450"
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Stock Available Quantity</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="100"
                    className="glass-input w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Product Description</label>
                  <textarea
                    required
                    rows="3"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Rich organic nitrogen compounds to boost crop yields."
                    className="glass-input w-full resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Product Photo (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageConversion(e, setProdImage)}
                    className="glass-input w-full cursor-pointer"
                  />
                </div>

                <button type="submit" className="btn-primary w-full mt-4 cursor-pointer text-sm">
                  Upload Product
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Marketplace;
