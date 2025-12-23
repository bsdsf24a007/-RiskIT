
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Scale, Target, Radio, Menu, X, ArrowRight,
  RefreshCw, Trophy, Search, Network, 
  ShieldCheck, Globe, BarChart3, Activity, ExternalLink,
  Zap, Shield, Flame, ChevronRight, AlertCircle,
  Gauge, TrendingUp as BullIcon, TrendingDown as BearIcon, OctagonAlert,
  Cpu, Sword, Gem, Landmark, PieChart, Coins, Users, Layers, Trash2,
  Sun, Moon, MousePointer2, ZapOff, Activity as PulseIcon, Key, Info,
  TrendingUp, TrendingDown, Info as InfoIcon
} from 'lucide-react';
import { 
  TabType, RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource, Metric 
} from './types';
import { 
  getArchitectStrategy, getComparison, getAnalysis, getLogicPulse, getApiKeyHint, getEngineStatus 
} from './services/geminiService';

// --- Shared Components ---

/**
 * QuantValue: Animates numbers counting up to simulate terminal data processing
 */
const QuantValue: React.FC<{ value: number; suffix?: string; prefix?: string; decimals?: number; liveUpdate?: boolean }> = ({ value, suffix = "", prefix = "", decimals = 0, liveUpdate = false }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [fluctuation, setFluctuation] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200;
    const startVal = displayValue;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easedProgress * (value - startVal) + startVal;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  useEffect(() => {
    if (!liveUpdate) {
      setFluctuation(0);
      return;
    }
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * (value * 0.001);
      setFluctuation(delta);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [liveUpdate, value]);

  const finalVal = displayValue + fluctuation;

  return <span className="tabular-nums">{prefix}{finalVal.toFixed(decimals)}{suffix}</span>;
};

const LiveSignal: React.FC = () => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
    <span className="text-[7px] font-black uppercase text-emerald-500 tracking-widest">Live_Signal</span>
  </div>
);

const TickerTape: React.FC = () => {
  const items = [
    { s: "SPX", p: "5,810.12", c: "+0.45%", u: true },
    { s: "NDX", p: "20,412.55", c: "+1.12%", u: true },
    { s: "BTC", p: "67,412.00", c: "+2.40%", u: true },
    { s: "KSE-100", p: "85,412.00", c: "+1.05%", u: true },
    { s: "GOLD", p: "2,714.20", c: "-0.32%", u: false },
    { s: "NVDA", p: "145.82", c: "+4.20%", u: true },
    { s: "TSLA", p: "220.10", c: "-1.15%", u: false },
    { s: "US10Y", p: "4.24", c: "+0.02%", u: true },
  ];

  return (
    <div className="h-8 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 overflow-hidden flex items-center group sticky top-0 z-50 shrink-0">
      <div className="flex animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6 border-r border-zinc-200 dark:border-white/5 h-8 shrink-0">
            <span className="text-[9px] font-black italic text-zinc-400 dark:text-zinc-500 tracking-tighter uppercase shrink-0">{item.s}</span>
            <span className="text-[9px] font-mono text-zinc-600 dark:text-zinc-200 shrink-0">{item.p}</span>
            <span className={`text-[8px] font-bold shrink-0 ${item.u ? 'text-emerald-500' : 'text-rose-500'}`}>
              {item.u ? '▲' : '▼'} {item.c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CardLoader: React.FC<{ label?: string }> = ({ label = "Synthesizing Data..." }) => (
  <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-lg z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
    <div className="scan-line" />
    <div className="w-10 h-10 mb-4 relative">
      <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
      <RefreshCw className="text-emerald-500 animate-spin absolute inset-0 m-auto" size={20} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2 animate-pulse">{label}</span>
  </div>
);

const ErrorOverlay: React.FC<{ message: string; onRetry: () => void; onDismiss: () => void }> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="absolute inset-0 bg-white/98 dark:bg-black/98 backdrop-blur-2xl z-[70] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
      <div className="w-12 h-12 mb-4 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
        <OctagonAlert className="text-rose-500 animate-pulse" size={24} />
      </div>
      <h3 className="text-lg font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">Pipeline Exhausted</h3>
      <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-white/5 mb-6 w-full max-sm overflow-hidden text-left">
        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed truncate">{message}</p>
      </div>
      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={onRetry} className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">Retry</button>
        <button onClick={onDismiss} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-black uppercase text-[10px] tracking-widest rounded-lg hover:border-zinc-400 transition-all">Dismiss</button>
      </div>
    </div>
  );
};

const NodeRow: React.FC<{ ticker: string; name: string; trend: number[]; onClick?: () => void }> = ({ ticker, name, trend, onClick }) => {
  const hasSignificantVariance = (Math.max(...trend) - Math.min(...trend)) > 2;
  const processedTrend = hasSignificantVariance 
    ? trend 
    : trend.map((v, i) => v + (Math.sin(i * 1.5) * 3) + (Math.random() * 2));

  const min = Math.min(...processedTrend);
  const max = Math.max(...processedTrend);
  const range = (max - min) || 1;
  const padding = range * 0.15;
  const pMin = min - padding;
  const pMax = max + padding;
  const pRange = pMax - pMin;

  const points = processedTrend.map((val, i) => {
    const x = (i / (processedTrend.length - 1)) * 100;
    const y = 100 - ((val - pMin) / pRange) * 100;
    return `${x},${y}`;
  }).join(' L ');

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-3 bg-white/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/5 rounded-xl hover:border-emerald-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer gap-3 overflow-hidden shadow-sm hover:shadow-md relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-3 min-w-0 flex-1 text-left relative z-10">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center justify-center font-black italic text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:scale-105 transition-all text-[8px] shrink-0 uppercase tracking-tighter">
          {ticker.substring(0, 4)}
        </div>
        <div className="min-w-0">
          <h4 className="font-black italic text-xs text-zinc-700 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors truncate uppercase leading-tight">{ticker}</h4>
          <p className="text-[7px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-[0.1em] truncate">{name}</p>
        </div>
      </div>
      <div className="w-12 h-6 shrink-0 relative z-10 overflow-visible">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <path 
            d={`M ${points}`} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_0_5px_rgba(16,185,129,0.3)] group-hover:stroke-emerald-400 transition-colors"
            style={{ 
              strokeDasharray: '300', 
              strokeDashoffset: '300',
              animation: 'pathDraw 2s ease-out forwards, pathFlow 10s linear infinite'
            }}
          />
        </svg>
      </div>
    </div>
  );
};

const RiskWidget: React.FC = () => {
  return (
    <div className="p-4 bg-zinc-100 dark:bg-zinc-900/20 rounded-xl border border-zinc-200 dark:border-white/5 space-y-3 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] dark:opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform"><Flame size={40} className="text-zinc-300 dark:text-zinc-700" /></div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-600 tracking-[0.2em]">Risk Status</span>
        <Flame size={10} className="text-orange-500 animate-pulse" />
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-emerald-500 rounded-full opacity-20" />
        <div className="flex-1 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
        <div className="flex-1 bg-rose-500 rounded-full opacity-10 animate-flicker" />
      </div>
      <div className="flex justify-between text-[7px] font-mono text-zinc-400 dark:text-zinc-600">
        <span>VIX_INDEX: 18.2</span>
        <span className="text-yellow-600 dark:text-yellow-500/80 uppercase font-bold tracking-tighter">NEUTRAL_MARKET</span>
      </div>
    </div>
  );
};

const TeamCredits: React.FC = () => {
  const members = ["Abdullah Rashid", "Moawiz", "Muhammad Abdullah"];
  return (
    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users size={12} className="text-zinc-400 dark:text-zinc-700" />
        <span className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-700 tracking-[0.3em]">Team</span>
      </div>
      <div className="space-y-1.5 px-1 text-left">
        {members.map((name, i) => (
          <div key={i} className="flex flex-col group/member">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 group-hover/member:text-zinc-900 dark:group-hover/member:text-zinc-200 transition-colors truncate">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SentimentCompass: React.FC<{ bullish: number; bearish: number; summary: string }> = ({ bullish, bearish, summary }) => {
  const diff = bullish - bearish;
  const rotation = (diff / 100) * 90; // -90 to 90 degrees

  return (
    <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 flex flex-col relative overflow-hidden group/compass">
       <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-600 tracking-[0.4em]">Sentiment_Compass</span>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-emerald-500/60 uppercase">Bullish</span>
                <span className="text-sm font-black text-emerald-500 italic">{bullish}%</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-rose-500/60 uppercase">Bearish</span>
                <span className="text-sm font-black text-rose-500 italic">{bearish}%</span>
             </div>
          </div>
       </div>

       <div className="relative h-24 flex items-end justify-center mb-6">
          <div className="absolute inset-0 flex items-end justify-center opacity-10 pointer-events-none">
             <div className="w-full h-full bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent absolute left-0 origin-bottom transform -rotate-45" />
             <div className="w-full h-full bg-gradient-to-t from-rose-500/20 via-transparent to-transparent absolute left-0 origin-bottom transform rotate-45" />
          </div>
          
          <div className="w-48 h-24 border-t-2 border-l-2 border-r-2 border-zinc-100 dark:border-zinc-800 rounded-t-full relative flex items-end justify-center">
             <div 
               className="absolute bottom-0 w-1 h-20 bg-emerald-500 origin-bottom transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
               style={{ transform: `rotate(${rotation}deg)` }}
             >
                <div className="w-3 h-3 bg-emerald-500 rounded-full -top-1 -left-1 absolute border-2 border-white dark:border-black" />
             </div>
          </div>
       </div>

       <div className="p-3 bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-white/5 rounded-xl">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed font-medium">"{summary}"</p>
       </div>
    </div>
  );
};

const MetricBlock: React.FC<{ title: string; metrics: Metric[] }> = ({ title, metrics }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2">
       <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-700 tracking-[0.3em]">{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
       {metrics.map((m, i) => (
         <div key={i} className="p-3 bg-white/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 rounded-xl shadow-sm hover:border-emerald-500/20 transition-all group/m">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 truncate">{m.label}</span>
               <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'positive' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : m.status === 'negative' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-zinc-400'}`} />
            </div>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-200 italic truncate block">{m.value}</span>
         </div>
       ))}
    </div>
  </div>
);

// --- Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('architect');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('riskit-theme') as 'light' | 'dark') || 'dark';
  });
  const engine = getEngineStatus();

  const [recInputs, setRecInputs] = useState({ amount: '50000', market: 'S&P 500', horizon: 'Medium Term', halal: true });
  const [compInputs, setCompInputs] = useState({ s1: '', s2: '' });
  const [anaInput, setAnaInput] = useState('');

  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [pulseItems, setPulseItems] = useState<any[]>([]);
  const [pulseSources, setPulseSources] = useState<GroundingSource[]>([]);

  useEffect(() => {
    const checkApiKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasApiKey(selected);
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('riskit-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeTab === 'pulse' && pulseItems.length === 0) handleFetchPulse();
  }, [activeTab]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleOpenKeySelector = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasApiKey(true);
  };

  const handleError = (e: any) => {
    const msg = e?.message || "Communication protocol failure.";
    if (msg.includes("Requested entity was not found")) {
      setHasApiKey(false);
      setApiError("Authentication expired. Please re-connect AI session.");
    } else {
      setApiError(msg);
    }
    setLoading(false);
  };

  const handleFetchPulse = async () => {
    setLoading(true); setApiError(null);
    try { 
      const { items, sources } = await getLogicPulse(); 
      setPulseItems(items); 
      setPulseSources(sources); 
    }
    catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleArchitect = async () => {
    setLoading(true); setApiError(null);
    try { const res = await getArchitectStrategy(recInputs.amount, recInputs.market, recInputs.horizon, recInputs.halal); setRecommendations(res); }
    catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleComparator = async (s1?: string, s2?: string) => {
    const finalS1 = s1 || compInputs.s1;
    const finalS2 = s2 || compInputs.s2;
    if (!finalS1 || !finalS2) return;
    if (s1 && s2) setCompInputs({ s1, s2 });
    setLoading(true); setApiError(null);
    try { const res = await getComparison(finalS1, finalS2, recInputs.market, recInputs.halal); setComparison(res); }
    catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleClearComparator = () => {
    setCompInputs({ s1: '', s2: '' });
    setComparison(null);
    setApiError(null);
  };

  const handlePathfinder = async (tickerOverride?: string) => {
    const ticker = tickerOverride || anaInput;
    if (!ticker) return;
    setLoading(true); setApiError(null);
    try {
      const result = await getAnalysis(ticker, recInputs.market, recInputs.horizon, recInputs.halal);
      setAnalysis(result); if (tickerOverride) setAnaInput(tickerOverride);
    } catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const getNormalizedHealth = (h: number) => h > 1 ? h / 100 : h;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black overflow-hidden font-sans selection:bg-emerald-500/20 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-64 bg-white dark:bg-[#050505] border-r border-zinc-200 dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black italic shadow-lg shrink-0 text-lg group-hover:scale-110 transition-transform">!</div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-white truncate">RiskIT</h1>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 transition-colors lg:hidden">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          <nav className="space-y-1.5 mb-8">
            {[
              { id: 'architect', label: 'Architect', icon: LayoutDashboard },
              { id: 'comparator', label: 'Comparator', icon: Scale },
              { id: 'pathfinder', label: 'Pathfinder', icon: Target },
              { id: 'pulse', label: 'Pulse', icon: Radio },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); setApiError(null); }} 
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all group relative overflow-hidden ${activeTab === tab.id ? 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-md' : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/20'}`}
              >
                {activeTab === tab.id && <div className="absolute left-0 h-4 w-1 bg-emerald-500 rounded-full" />}
                <tab.icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : 'group-hover:text-zinc-400 dark:group-hover:text-zinc-300'} />
                <span className="font-bold uppercase text-[9px] tracking-[0.2em] truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <RiskWidget />
          <TeamCredits />
        </div>
        
        <div className="p-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0 space-y-3">
          {!hasApiKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all group"
            >
              <Key size={12} className="group-hover:rotate-12 transition-transform" />
              Connect Secure AI
            </button>
          )}
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-black border border-zinc-200 dark:border-white/5 rounded-xl relative overflow-hidden group/status">
             <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover/status:translate-y-0 transition-transform" />
             <Cpu size={12} className={`shrink-0 z-10 ${engine !== 'DISCONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`} />
             <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-300 font-bold tracking-tighter truncate z-10 uppercase">{engine}</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-400 dark:text-zinc-700 px-1">
            <span>SYS_STABILITY</span>
            <span className="text-emerald-500/60 uppercase">OK</span>
          </div>
        </div>
        <button className="absolute top-6 right-6 text-zinc-400 dark:text-zinc-600 lg:hidden p-2" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-50 dark:bg-[#020202]">
        <TickerTape />
        
        <header className="h-14 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-6 bg-white/90 dark:bg-black/90 backdrop-blur-md z-[80] shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-2 rounded-lg lg:hidden"><Menu size={20} /></button>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-500 italic truncate">{activeTab}</span>
            {recommendations || analysis || comparison || pulseItems.length > 0 ? <LiveSignal /> : null}
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setLiveMode(!liveMode)}
              className={`p-2.5 rounded-xl transition-all border shadow-sm active:scale-95 flex items-center gap-2 ${liveMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-900/60 border-zinc-200 dark:border-white/5 text-zinc-400'}`}
              title={liveMode ? 'Deactivate Live Simulation' : 'Activate Live Simulation'}
             >
              {liveMode ? <PulseIcon size={16} className="animate-pulse" /> : <ZapOff size={16} />}
              <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">{liveMode ? 'Live' : 'Static'}</span>
             </button>

             <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-500 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
             </button>
             <div className="w-px h-6 bg-zinc-200 dark:bg-white/5 mx-1" />
             <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black italic text-[10px]">R</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 space-y-8">
          
          {/* ARCHITECT TAB */}
          {activeTab === 'architect' && (
            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 animate-in fade-in slide-in-from-bottom-6 max-w-[1400px] mx-auto w-full">
              <div className="glass-card p-6 relative h-fit text-left flex flex-col gap-6">
                {loading && <CardLoader label="Processing..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleArchitect} onDismiss={() => setApiError(null)} />}
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">ARCHITECT</h2>
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Strategy Lab</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5"><label className="text-zinc-400 dark:text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Asset Allocation</label><input type="number" className="field-input py-2" value={recInputs.amount} onChange={(e) => setRecInputs({ ...recInputs, amount: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-zinc-400 dark:text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Market Segment</label><input type="text" className="field-input py-2" placeholder="e.g. US Tech" value={recInputs.market} onChange={(e) => setRecInputs({ ...recInputs, market: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-zinc-400 dark:text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Horizon</label><select className="field-input py-2" value={recInputs.horizon} onChange={(e) => setRecInputs({ ...recInputs, horizon: e.target.value })}><option>Short Term</option><option>Medium Term</option><option>Long Term</option></select></div>
                  
                  <div className="flex flex-col justify-center p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all group/sharia shadow-inner" onClick={() => setRecInputs({ ...recInputs, halal: !recInputs.halal })}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black italic uppercase ${recInputs.halal ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-700'}`}>Sharia Filter</span>
                      <ShieldCheck size={16} className={`${recInputs.halal ? 'text-emerald-500' : 'text-zinc-200 dark:text-zinc-800'} group-hover/sharia:scale-110 transition-transform`} />
                    </div>
                  </div>
                </div>

                <button onClick={handleArchitect} disabled={loading} className="btn-primary w-full py-3 text-[10px] group/btn">
                  <PieChart size={14} className="group-hover/btn:rotate-12 transition-transform" />
                  <span>Generate Blueprint</span>
                </button>
              </div>

              <div className="glass-card p-6 bg-white dark:bg-zinc-950/20 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-white/5 pb-4">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em]">Strategic Nodes</span>
                  <div className="flex gap-2">
                    {recommendations && <div className="animate-pulse flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[8px] font-black uppercase text-emerald-500">Node_Synced</span></div>}
                    <RefreshCw size={12} className={`text-zinc-200 dark:text-zinc-800 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                  </div>
                </div>
                {recommendations ? (
                  <div className="space-y-6 animate-in fade-in duration-500 text-left">
                    <p className="text-base text-zinc-600 dark:text-zinc-300 font-medium italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/[0.01] dark:bg-emerald-500/[0.02] py-4 pr-4 rounded-r-xl">{recommendations.strategy}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto custom-scroll pr-2">
                      {recommendations.nodes.map((node, i) => (
                        <NodeRow key={i} {...node} onClick={() => { setActiveTab('pathfinder'); handlePathfinder(node.ticker); }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 dark:opacity-10">
                    <div className="relative">
                      <Coins size={80} className="text-zinc-300 dark:text-zinc-500" />
                      <div className="absolute inset-0 animate-pulse border-2 border-emerald-500/10 dark:border-emerald-500/20 rounded-full scale-150" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATHFINDER TAB */}
          {activeTab === 'pathfinder' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 w-full pb-20">
              <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-6 bg-white dark:bg-zinc-950 relative overflow-hidden group/search shadow-xl dark:shadow-none">
                {loading && <CardLoader label="Scanning..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handlePathfinder()} onDismiss={() => setApiError(null)} />}
                <Search className="text-zinc-300 dark:text-zinc-800 shrink-0 group-hover/search:text-emerald-500 transition-colors" size={32} />
                <input 
                  placeholder="ENTER TICKER OR INDEX..." 
                  className="flex-1 bg-transparent text-2xl sm:text-4xl font-black italic uppercase outline-none placeholder:text-zinc-100 dark:placeholder:text-zinc-900 text-zinc-900 dark:text-white tracking-tighter w-full min-w-0" 
                  value={anaInput} 
                  onChange={(e) => setAnaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePathfinder()}
                />
                <button onClick={() => handlePathfinder()} className="btn-primary w-full md:w-auto px-8 py-3 text-[10px]">Execute Neural Audit</button>
              </div>

              {analysis && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 animate-in zoom-in-95 text-left items-start">
                  <div className="space-y-8">
                    {/* Header Scorecard */}
                    <div className="glass-card p-6 sm:p-10 bg-white/80 dark:bg-zinc-950/80 border-black/5 dark:border-white/5 relative overflow-hidden min-w-0">
                      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                             <h2 className="font-black italic uppercase leading-none text-zinc-900 dark:text-white break-words" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}>{analysis.ticker}</h2>
                             <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-2">MKT_ASSET</div>
                          </div>
                          <p className="text-sm sm:text-xl text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] italic truncate">{analysis.name}</p>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                           <div className="flex flex-col items-center gap-2">
                             <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                   <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-[#09090b]" />
                                   <circle 
                                     cx="50" cy="50" r="44" fill="none" stroke="#10b981" strokeWidth="8" 
                                     strokeDasharray="276" 
                                     strokeDashoffset={276 * (1 - getNormalizedHealth(analysis.health))} 
                                     strokeLinecap="round" 
                                     className="transition-all duration-1000 ease-out"
                                   />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                   <span className="text-2xl font-black italic text-emerald-500 leading-none">
                                     <QuantValue value={Math.round(getNormalizedHealth(analysis.health) * 100)} liveUpdate={liveMode} />
                                   </span>
                                   <span className="text-[7px] font-black uppercase text-zinc-400 mt-1">Health</span>
                                </div>
                             </div>
                           </div>

                           <div className="h-16 w-px bg-zinc-200 dark:bg-zinc-800" />

                           <div className="flex flex-col items-center gap-1">
                              <span className="text-4xl font-black italic text-zinc-900 dark:text-white leading-none">{analysis.riskScore}</span>
                              <span className="text-[8px] font-black uppercase text-rose-500 tracking-[0.2em]">Risk_Rating</span>
                           </div>
                        </div>
                      </div>

                      <div className="mt-10 p-5 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-white/5 rounded-2xl relative shadow-inner">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/20" />
                        <p className="text-sm sm:text-lg text-zinc-500 dark:text-zinc-400 italic leading-relaxed break-words pl-4">"{analysis.desc}"</p>
                      </div>
                    </div>

                    {/* Market Relevant Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <MetricBlock title="Fundamental Pillars" metrics={analysis.fundamentals} />
                       <MetricBlock title="Technical Momentum" metrics={analysis.technicals} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <SentimentCompass 
                         bullish={analysis.sentiment.bullish} 
                         bearish={analysis.sentiment.bearish} 
                         summary={analysis.sentiment.summary} 
                       />
                       
                       <div className="glass-card p-6 bg-white/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 flex flex-col justify-between">
                          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2 mb-4">
                             <BarChart3 size={14} className="text-zinc-300 dark:text-zinc-700" />
                             <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-700 tracking-[0.3em]">Conviction_Tiers</span>
                          </div>
                          <div className="space-y-6">
                             <div className="flex items-center justify-between group/outlook">
                                <div>
                                   <span className="text-[7px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Bias_Vector</span>
                                   <span className="text-emerald-500 font-black italic text-sm uppercase group-hover:translate-x-1 transition-transform inline-block">{analysis.short}</span>
                                </div>
                                <TrendingUp size={24} className="text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
                             </div>
                             <div className="h-px bg-zinc-100 dark:bg-zinc-900" />
                             <div className="flex items-center justify-between group/long">
                                <div>
                                   <span className="text-[7px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Stability_Metric</span>
                                   <span className="text-blue-500 font-black italic text-sm uppercase group-hover:translate-x-1 transition-transform inline-block">{analysis.long}</span>
                                </div>
                                <Shield size={24} className="text-blue-500/20 group-hover:text-blue-500 transition-colors" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8 sticky top-24">
                    {/* Risk Catalysts Section */}
                    <div className="glass-card p-6 bg-white dark:bg-zinc-950/60 shadow-xl border-zinc-200 dark:border-white/5">
                       <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-3 mb-6">
                          <OctagonAlert size={16} className="text-rose-500" />
                          <h3 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-600 tracking-widest">Active Risk Catalysts</h3>
                       </div>
                       
                       <div className="space-y-4">
                          {analysis.catalysts.map((cat, i) => (
                            <div key={i} className="group/cat relative p-4 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-2xl hover:border-rose-500/20 transition-all shadow-sm">
                               <div className="flex items-center justify-between mb-2">
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${cat.impact === 'high' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : cat.impact === 'medium' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : 'text-zinc-400 border-zinc-200 dark:border-white/10'}`}>
                                   {cat.impact.toUpperCase()}_IMPACT
                                 </span>
                                 <InfoIcon size={12} className="text-zinc-300 dark:text-zinc-800 opacity-0 group-hover/cat:opacity-100 transition-opacity" />
                               </div>
                               <h4 className="text-[12px] font-black text-zinc-800 dark:text-zinc-200 italic mb-2 leading-tight uppercase">{cat.title}</h4>
                               <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium">
                                 {cat.description}
                               </p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Data Verification Footer */}
                    <div className="p-4 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-white/5">
                       <div className="flex items-center gap-2 mb-2">
                          <Globe size={10} className="text-zinc-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Grounding_Context</span>
                       </div>
                       <SourceLink sources={analysis.sources || []} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPARATOR TAB */}
          {activeTab === 'comparator' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 w-full pb-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
                 <div className="text-left">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">DUEL RESOLVER</h2>
                   <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-[0.4em]">Multi-Node Benchmarking</p>
                 </div>
                 <button 
                  onClick={handleClearComparator} 
                  className="group flex items-center gap-2 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
                 >
                   <Trash2 size={12} className="group-hover:rotate-12 transition-transform" /> 
                   Clear All Nodes
                 </button>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 px-4">
                {[
                  { l: "DXY vs SPX", a: "DXY", b: "SPX" },
                  { l: "BTC vs ETH", a: "BTC", b: "ETH" },
                  { l: "NVDA vs AMD", a: "NVDA", b: "AMD" },
                  { l: "TLT vs QQQ", a: "TLT", b: "QQQ" },
                ].map((d, i) => (
                  <button key={i} onClick={() => handleComparator(d.a, d.b)} className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-all hover:border-emerald-500/20 active:scale-95 shadow-sm">
                    {d.l}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch relative text-left px-4">
                {loading && <CardLoader label="Synthesizing Duel Logic..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handleComparator()} onDismiss={() => setApiError(null)} />}
                
                <div className="glass-card p-6 sm:p-10 bg-blue-500/[0.03] dark:bg-blue-600/[0.02] border-blue-500/20 dark:border-blue-500/40 shadow-[0_0_50px_rgba(37,99,235,0.08)] hover:border-blue-500/50 group/alpha transition-all relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/30 rounded-l-[var(--radius-xl)]" />
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                        <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] italic">ALPHA_TERMINAL</span>
                     </div>
                     <Landmark size={14} className="text-blue-500/20" />
                   </div>
                   <div className="relative group/field">
                     <input 
                       className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-6 text-center text-4xl sm:text-6xl font-black italic uppercase text-blue-600 dark:text-blue-100 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-900 tracking-tighter shadow-inner" 
                       placeholder="NODE_A" 
                       value={compInputs.s1} 
                       onChange={(e) => setCompInputs({ ...compInputs, s1: e.target.value.toUpperCase() })} 
                     />
                   </div>
                </div>

                <div className="flex items-center justify-center relative">
                  <div className="absolute inset-y-0 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
                  <div className="w-16 h-16 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-2xl md:rounded-full select-none shrink-0 border-2 border-zinc-200 dark:border-zinc-800 z-10 shadow-2xl transform hover:rotate-[360deg] transition-transform duration-1000 group/vs">
                    <span className="text-zinc-400 dark:text-zinc-600 font-black italic text-xl tracking-tighter group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">VS</span>
                  </div>
                </div>

                <div className="glass-card p-6 sm:p-10 bg-rose-500/[0.03] dark:bg-rose-600/[0.02] border-rose-500/20 dark:border-rose-500/40 shadow-[0_0_50px_rgba(225,29,72,0.08)] hover:border-rose-500/50 group/beta transition-all relative overflow-hidden text-right">
                   <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-600/30 rounded-r-[var(--radius-xl)]" />
                   <div className="flex items-center justify-between mb-8">
                     <Landmark size={14} className="text-rose-500/20" />
                     <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] italic">BETA_TERMINAL</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                     </div>
                   </div>
                   <div className="relative group/field-b">
                     <input 
                       className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-6 text-center text-4xl sm:text-6xl font-black italic uppercase text-rose-600 dark:text-rose-100 outline-none focus:border-rose-500 transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-900 tracking-tighter shadow-inner" 
                       placeholder="NODE_B" 
                       value={compInputs.s2} 
                       onChange={(e) => setCompInputs({ ...compInputs, s2: e.target.value.toUpperCase() })} 
                     />
                   </div>
                </div>
              </div>

              <div className="px-4">
                <button 
                  onClick={() => handleComparator()} 
                  disabled={loading} 
                  className="btn-primary w-full py-6 text-[14px] italic font-black rounded-2xl shadow-2xl hover:shadow-emerald-500/30 group/duel border-2 border-emerald-500/20"
                >
                  <Sword size={20} className="group-hover:rotate-12 transition-transform" />
                  GENERATE COMPARATIVE RESOLUTION
                </button>
              </div>
              
              {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 animate-in zoom-in-95 mt-10 px-4">
                  <div className={`glass-card p-10 flex flex-col justify-center relative rounded-[2rem] overflow-hidden text-left shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-700 ${comparison.winner === compInputs.s1 ? 'bg-blue-600/10 dark:bg-blue-900/40 border-blue-500/40' : 'bg-rose-600/10 dark:bg-rose-900/40 border-rose-500/40'}`}>
                    <div className="absolute top-0 right-0 p-6 opacity-[0.1] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform"><Trophy size={120} /></div>
                    <div className="flex items-center gap-2 mb-8">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                       <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-600 dark:text-emerald-500">RESOLVED_SUPERIOR</span>
                    </div>
                    <h2 className="font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white mb-10 break-words" style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)' }}>{comparison.winner}</h2>
                    <div className="bg-white dark:bg-black/90 p-5 rounded-3xl inline-flex items-center gap-4 w-fit border border-zinc-200 dark:border-white/10 shadow-xl backdrop-blur-xl">
                       <div className="bg-emerald-500 p-2 rounded-lg"><Zap size={20} className="text-black" /></div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Decision</span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate">{comparison.decision}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-8 sm:p-12 bg-white/90 dark:bg-zinc-950/70 border-zinc-200 dark:border-white/10 rounded-[2rem] min-w-0 shadow-2xl text-left relative overflow-hidden backdrop-blur-3xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-zinc-200 dark:via-zinc-800 to-rose-500 opacity-40" />
                    <div className="flex items-center justify-between mb-16 pb-6 border-b border-zinc-100 dark:border-white/5">
                       <h3 className="text-[12px] font-black uppercase text-zinc-400 dark:text-zinc-600 tracking-[0.6em]">Neural Comparison Ledger</h3>
                       <Layers size={16} className="text-zinc-200 dark:text-zinc-800" />
                    </div>
                    
                    <div className="space-y-16">
                      {comparison.scorecard.map((s, i) => (
                        <div key={i} className="group/metric-row relative">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-6 mb-6">
                            <div className="flex flex-col bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 transition-all hover:border-blue-500/30">
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">{compInputs.s1 || 'ALPHA'}</span>
                              <span className="text-2xl sm:text-3xl font-black italic text-blue-900 dark:text-blue-100 truncate tracking-tighter">{s.s1Value}</span>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center pb-2">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] whitespace-nowrap px-4 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm">{s.label}</span>
                            </div>
                            
                            <div className="flex flex-col text-right bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-900/20 transition-all hover:border-rose-500/30">
                              <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">{compInputs.s2 || 'BETA'}</span>
                              <span className="text-2xl sm:text-3xl font-black italic text-rose-900 dark:text-rose-100 truncate tracking-tighter">{s.s2Value}</span>
                            </div>
                          </div>
                          
                          <div className="relative h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-inner overflow-hidden flex">
                             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-rose-500/10 pointer-events-none" />
                             <div 
                              className="h-full bg-gradient-to-r from-blue-700 to-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out relative group-hover/metric-row:brightness-110" 
                              style={{ width: `${s.s1Percent / (s.s1Percent + s.s2Percent) * 100}%` }}
                             >
                               <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/30 blur-[2px]" />
                             </div>
                             <div 
                              className="h-full bg-gradient-to-l from-rose-700 to-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all duration-1000 ease-out relative group-hover/metric-row:brightness-110" 
                              style={{ width: `${s.s2Percent / (s.s1Percent + s.s2Percent) * 100}%` }}
                             >
                               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/30 blur-[2px]" />
                             </div>
                             <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white dark:bg-black/90 z-20 shadow-[0_0_15px_black]" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-20 p-10 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-3xl relative overflow-hidden group/summary shadow-inner backdrop-blur-xl">
                      <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500/20" />
                      <div className="absolute top-4 right-6 opacity-[0.05]"><Activity size={40} /></div>
                      <p className="text-lg sm:text-2xl text-zinc-600 dark:text-zinc-300 italic leading-relaxed break-words font-medium group-hover/summary:text-zinc-900 dark:group-hover/summary:text-white transition-colors">"{comparison.summary}"</p>
                    </div>
                    <SourceLink sources={comparison.sources || []} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PULSE TAB */}
          {activeTab === 'pulse' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 w-full pb-20">
               <div className="flex justify-between items-end gap-4 mb-8 text-left px-4">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">PULSE</h2>
                     <p className="text-[8px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-[0.4em]">Live Intel Feed</p>
                  </div>
                  <button onClick={handleFetchPulse} className="w-10 h-10 glass-card items-center justify-center text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all shadow-lg hover:border-emerald-500/20"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
               </div>
               
               <div className="space-y-3 px-4 min-h-[400px]">
                  {loading && <CardLoader label="Syncing Intelligence..." />}
                  {apiError && <ErrorOverlay message={apiError} onRetry={handleFetchPulse} onDismiss={() => setApiError(null)} />}
                  
                  {pulseItems.length > 0 ? (
                    pulseItems.map((item, i) => (
                      <div key={i} className="group glass-card flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all border-l-2 border-l-zinc-100 dark:border-l-zinc-900 hover:border-l-emerald-500 cursor-pointer text-left gap-4 overflow-hidden shadow-sm hover:shadow-md relative">
                        {i === 0 && <div className="absolute top-0 right-0 p-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /></div>}
                        <div className="flex items-start md:items-center gap-4 min-w-0">
                          <div className="text-left md:text-center min-w-[70px] shrink-0">
                            <span className="block font-mono text-zinc-400 dark:text-zinc-700 text-[9px] mb-1">{item.time || 'NOW'}</span>
                            <div className={`text-[7px] font-black px-1.5 py-0.5 rounded border inline-block ${item.impact?.toLowerCase() === 'high' ? 'text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.2)]' : 'text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]'}`}>
                              {item.impact?.toUpperCase() || 'NORMAL'}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors text-base mb-1 uppercase italic truncate leading-tight">{item.title}</h4>
                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">{item.sector || 'GENERAL'}</span>
                          </div>
                        </div>
                        <ArrowRight size={20} className="hidden md:block text-zinc-200 dark:text-zinc-900 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    ))
                  ) : !loading && !apiError && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                      <PulseIcon size={48} className="text-zinc-400 mb-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Feed_Empty_Signal</span>
                      <button onClick={handleFetchPulse} className="mt-4 text-emerald-500 hover:text-emerald-400 text-[9px] font-bold uppercase underline">Manual Sync</button>
                    </div>
                  )}
                  <SourceLink sources={pulseSources} />
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const SourceLink: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-2 space-y-2">
       {sources.slice(0, 3).map((s, i) => (
         <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-white dark:bg-black/20 border border-zinc-100 dark:border-white/5 rounded-lg hover:border-emerald-500/30 transition-all group overflow-hidden">
           <span className="text-[8px] text-zinc-400 group-hover:text-zinc-200 truncate pr-4 font-bold uppercase">{s.title}</span>
           <ExternalLink size={8} className="text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500" />
         </a>
       ))}
    </div>
  );
};
