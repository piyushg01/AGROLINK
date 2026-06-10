import React from 'react';
import { 
  UploadCloud, Sparkles, AlertTriangle, TrendingUp, TrendingDown,
  Scale, Users, Truck, Star, ShieldAlert, Award, ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * 1. Crop Upload Card
 */
export const CropUploadCard = ({ 
  cropImage, 
  imagePreview, 
  targetQuantity, 
  setTargetQuantity, 
  handleImageChange, 
  applyPreset, 
  triggerAnalysis, 
  isLoading 
}) => {
  const { t } = useLanguage();

  return (
    <div className="glass-panel p-6 space-y-4 border-l-4 border-l-emerald-500 bg-gradient-to-tr from-slate-900/60 to-slate-950/40">
      <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-emerald-400" />
          {t('uploadCropImage')}
        </h3>
        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
      </div>

      {/* File Dropzone */}
      <div className="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-3 relative hover:border-emerald-500/40 transition-colors bg-slate-950/20 min-h-[140px]">
        <UploadCloud className="w-8 h-8 text-emerald-400" />
        <div className="text-[10px]">
          <p className="font-bold text-slate-200">Drag or click to choose leaf image</p>
          <p className="text-slate-500 mt-0.5">Base64 PNG, JPG up to 10MB</p>
        </div>
        <input
          type="file"
          accept="image/*"
          disabled={isLoading}
          onChange={handleImageChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {imagePreview && (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-800">
          <img src={imagePreview} alt="Leaf upload preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Fast Presets Grid */}
      <div className="space-y-1.5">
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Leaf Presets</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => applyPreset('wheat_rust')}
            disabled={isLoading}
            className="py-1.5 px-1 rounded-lg text-[9px] font-bold text-center border border-slate-800 bg-slate-900/30 text-slate-450 hover:border-slate-700 transition-colors cursor-pointer"
          >
            🌾 Wheat Rust
          </button>
          <button
            onClick={() => applyPreset('tomato_blight')}
            disabled={isLoading}
            className="py-1.5 px-1 rounded-lg text-[9px] font-bold text-center border border-slate-800 bg-slate-900/30 text-slate-450 hover:border-slate-700 transition-colors cursor-pointer"
          >
            🍅 Tomato Blight
          </button>
          <button
            onClick={() => applyPreset('healthy_leaf')}
            disabled={isLoading}
            className="py-1.5 px-1 rounded-lg text-[9px] font-bold text-center border border-slate-800 bg-slate-900/30 text-slate-450 hover:border-slate-700 transition-colors cursor-pointer"
          >
            🥬 Healthy Leaf
          </button>
        </div>
      </div>

      {/* Target Quantity Slider */}
      <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900/50">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-slate-400">Target Crop Volume:</span>
          <span className="text-emerald-400 font-extrabold">{targetQuantity} kg</span>
        </div>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={targetQuantity}
          disabled={isLoading}
          onChange={(e) => setTargetQuantity(parseInt(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Analyze Button */}
      <button
        onClick={triggerAnalysis}
        disabled={isLoading}
        className="w-full btn-primary py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Analyzing Assets...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-white" />
            Launch AI Command Pipeline
          </>
        )}
      </button>
    </div>
  );
};

/**
 * 2. Disease Analysis Card
 */
export const DiseaseAnalysisCard = ({ data, isLoading }) => {
  const { t } = useLanguage();

  if (isLoading) return <LoadingCard title={t('diseaseAnalysisHeader')} />;
  if (!data) return <IdleCard title={t('diseaseAnalysisHeader')} />;

  const isHealthy = data.severity === 'None';

  return (
    <div className="glass-panel p-6 space-y-4 border-l-4 border-l-emerald-500">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <ShieldAlert className="w-4.5 h-4.5 text-emerald-400" />
        {t('diseaseAnalysisHeader')}
      </h3>

      <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900/60 space-y-3">
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('diseaseNameLabel')}</span>
          <p className="text-xs font-black text-slate-200 mt-0.5">{data.diseaseName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('confidenceLabel')}</span>
            <p className="text-xs font-black text-emerald-400 mt-0.5">{data.confidence}%</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('severityLabel')}</span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block mt-0.5 ${
              data.severity === 'High' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : data.severity === 'Medium'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {data.severity}
            </span>
          </div>
        </div>

        {data.description && (
          <p className="text-[10px] text-slate-400 italic leading-relaxed border-t border-slate-900/40 pt-2">
            {data.description}
          </p>
        )}

        {!isHealthy && data.treatment?.length > 0 && (
          <div className="border-t border-slate-900/40 pt-2 space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">Treatment Cures:</span>
            <p className="text-[10px] text-slate-350 leading-relaxed">{data.treatment[0]}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3. Market Intelligence Card
 */
export const MarketIntelligenceCard = ({ data, isLoading }) => {
  const { t } = useLanguage();

  if (isLoading) return <LoadingCard title={t('marketIntelligenceHeader')} />;
  if (!data) return <IdleCard title={t('marketIntelligenceHeader')} />;

  const isUpward = data.trend === 'Upward';

  return (
    <div className="glass-panel p-6 space-y-4 border-l-4 border-l-blue-500">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Award className="w-4.5 h-4.5 text-blue-400" />
        {t('marketIntelligenceHeader')}
      </h3>

      <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900/60 space-y-3.5">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('currentPriceLabel')}</span>
            <p className="text-lg font-black text-white mt-0.5">₹{data.currentPrice}/kg</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('predictedPriceLabel')}</span>
            <p className="text-lg font-black text-blue-400 mt-0.5">₹{data.predictedPrice}/kg</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] border-t border-slate-900/40 pt-2">
          <span className="text-slate-500 font-bold">{t('trendLabel')}:</span>
          <span className={`flex items-center gap-1 font-extrabold ${isUpward ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUpward ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {data.trend}
          </span>
        </div>

        {data.recommendation && (
          <p className="text-[9.5px] text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/80">
            {data.recommendation}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * 4. Buyer Recommendation Card
 */
export const BuyerRecommendationCard = ({ data, isLoading }) => {
  const { t } = useLanguage();

  if (isLoading) return <LoadingCard title={t('buyerRecommendationHeader')} />;
  if (!data) return <IdleCard title={t('buyerRecommendationHeader')} />;

  return (
    <div className="glass-panel p-6 space-y-4 border-l-4 border-l-purple-500">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Users className="w-4.5 h-4.5 text-purple-400" />
        {t('buyerRecommendationHeader')}
      </h3>

      <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900/60 space-y-3.5">
        <div>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide block">{t('bestBuyerLabel')}</span>
          <p className="text-xs font-black text-white mt-0.5">{data.bestBuyer}</p>
        </div>

        <div className="flex justify-between items-center text-[10px] border-t border-slate-900/40 pt-2">
          <span className="text-slate-500 font-bold">{t('buyerRatingLabel')}:</span>
          <span className="flex items-center gap-0.5 text-amber-400 font-extrabold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            ★ {data.buyerRating}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px] border-t border-slate-900/40 pt-2">
          <span className="text-slate-500 font-bold">{t('offeredPriceLabel')}:</span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">₹{data.offeredPrice}/kg</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. Profit Calculator Card
 */
export const ProfitCalculatorCard = ({ data, isLoading }) => {
  const { t } = useLanguage();

  if (isLoading) return <LoadingCard title={t('profitCalculatorHeader')} />;
  if (!data) return <IdleCard title={t('profitCalculatorHeader')} />;

  return (
    <div className="glass-panel p-6 space-y-4 border-l-4 border-l-amber-500">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Scale className="w-4.5 h-4.5 text-amber-400" />
        {t('profitCalculatorHeader')}
      </h3>

      <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-900/60 space-y-2.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500 font-bold">Volume:</span>
          <span className="text-slate-200 font-extrabold">{data.targetQuantity} kg</span>
        </div>

        <div className="flex justify-between text-[10px] border-t border-slate-900/30 pt-2">
          <span className="text-slate-500 font-bold">{t('expectedRevenueLabel')}:</span>
          <span className="text-slate-200 font-extrabold">₹{data.expectedRevenue?.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between text-[10px] border-t border-slate-900/30 pt-2">
          <span className="text-slate-500 font-bold">Estimated Freight Cost:</span>
          <span className="text-red-400 font-extrabold flex items-center gap-0.5">
            <Truck className="w-3.5 h-3.5" />
            -₹{data.transportCost?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs border-t border-slate-900/40 pt-2.5 font-black">
          <span className="text-slate-400 uppercase text-[9px]">{t('expectedProfitLabel')}:</span>
          <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 text-sm">
            ₹{data.expectedProfit?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. Final Recommendation Card
 */
export const FinalRecommendationCard = ({ recommendation, isLoading }) => {
  const { t } = useLanguage();

  if (isLoading) return <LoadingCard title={t('finalRecommendationHeader')} />;
  if (!recommendation) return <IdleCard title={t('finalRecommendationHeader')} />;

  const isHold = recommendation.toLowerCase().includes('hold');
  const isTreat = recommendation.toLowerCase().includes('treat');

  return (
    <div className={`glass-panel p-6 space-y-4 border-l-4 relative overflow-hidden ${
      isTreat 
        ? 'border-l-red-500 bg-gradient-to-r from-red-950/15 to-transparent' 
        : isHold 
        ? 'border-l-amber-500 bg-gradient-to-r from-amber-950/15 to-transparent' 
        : 'border-l-emerald-500 bg-gradient-to-r from-emerald-950/15 to-transparent'
    }`}>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Award className="w-4.5 h-4.5 text-slate-200" />
        {t('finalRecommendationHeader')}
      </h3>

      <div className="bg-slate-950/45 p-5 rounded-2xl border border-slate-900/80 flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          isTreat ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
          : isHold ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Decision Vector</span>
          <p className="text-xs leading-relaxed font-bold text-slate-200">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

/* Helper placeholder components */
const LoadingCard = ({ title }) => (
  <div className="glass-panel p-6 space-y-4 min-h-[180px] flex flex-col justify-between border-slate-900/60 opacity-60">
    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{title}</h3>
    <div className="py-6 text-center space-y-2">
      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Analyzing metrics...</span>
    </div>
  </div>
);

const IdleCard = ({ title }) => (
  <div className="glass-panel p-6 space-y-4 min-h-[180px] flex flex-col justify-between border-slate-900/40 opacity-40">
    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">{title}</h3>
    <div className="py-6 text-center italic text-[10px] text-slate-600">
      Pipeline not run yet. Select leaf on left panel to initialize.
    </div>
  </div>
);
