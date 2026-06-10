import React from 'react';
import { CheckCircle2, Loader2, PlayCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AIWorkflow = ({ activeStep, status }) => {
  const { t } = useLanguage();

  const steps = [
    { id: 1, label: t('agentDiseaseTitle') },
    { id: 2, label: t('agentMarketTitle') },
    { id: 3, label: t('agentBuyerTitle') },
    { id: 4, label: t('agentProfitTitle') },
    { id: 5, label: t('agentFinalReportTitle') }
  ];

  return (
    <div className="glass-panel p-6 bg-slate-950/40 border border-slate-900/60 rounded-2xl w-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
        {steps.map((s, idx) => {
          const isCompleted = activeStep > s.id || (status === 'completed' && activeStep >= s.id);
          const isActive = activeStep === s.id && status === 'running';
          const isIdle = activeStep < s.id && status !== 'completed';

          return (
            <React.Fragment key={s.id}>
              {/* Step Circle Card */}
              <div 
                className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-300 w-full md:w-36 ${
                  isActive 
                    ? 'bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-105' 
                    : isCompleted 
                    ? 'bg-slate-900/60 border-emerald-900/60 opacity-90'
                    : 'bg-slate-950/40 border-slate-900/40 opacity-50'
                }`}
              >
                {/* Step Icon Status Indicator */}
                <div className="mb-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-pulse-slow" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  ) : status === 'failed' && activeStep === s.id ? (
                    <div className="w-6 h-6 rounded-full bg-red-950 border border-red-500 flex items-center justify-center text-red-500 text-[10px] font-black">X</div>
                  ) : (
                    <PlayCircle className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Step {s.id}</span>
                <span className="text-xs font-bold text-white mt-0.5 leading-none block">{s.label}</span>
              </div>

              {/* Connecting Line Connector (Except Last Step) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 relative mx-2">
                  <div className="absolute inset-0 bg-slate-900/80 rounded"></div>
                  <div 
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded ${
                      isCompleted ? 'w-full' : isActive ? 'w-1/2 animate-pulse' : 'w-0'
                    }`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default AIWorkflow;
