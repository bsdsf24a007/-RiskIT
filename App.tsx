
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Scale, Target, Radio, Menu, X, ArrowRight,
  RefreshCw, Trophy, Search, Network, 
  ShieldCheck, Globe, BarChart3, Activity, ExternalLink,
  Zap, Shield, Flame, ChevronRight, AlertCircle,
  Gauge, TrendingUp as BullIcon, TrendingDown as BearIcon, OctagonAlert,
  Cpu, Sword, Gem, Landmark, PieChart, Coins, Users, Layers, Trash2
} from 'lucide-react';
import { 
  TabType, RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource 
} from './types';
import { 
  getArchitectStrategy, getComparison, getAnalysis, getLogicPulse, getApiKeyHint, getEngineStatus 
} from './services/geminiService';

// --- Shared Components ---

/**
 * QuantValue: Animates numbers counting up to simulate terminal data processing
 */
const QuantValue: React.FC<{ value: number; suffix?: string; prefix?: string; decimals?: number }> = ({ value, suffix = "", prefix = "", decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200;
    const startVal = displayValue;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function: easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easedProgress * (value - startVal) + startVal;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{displayValue.toFixed(decimals)}{suffix}</span>;
};

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
    <div className="h-8 bg-black/80 backdrop-blur-md border-b border-white/5 overflow-hidden flex items-center group sticky top-0 z-50 shrink-0">
      <div className="flex animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6 border-r border-white/5 h-8 shrink-0">
            <span className="text-[9px] font-black italic text-zinc-500 tracking-tighter uppercase shrink-0">{item.s}</span>
            <span className="text-[9px] font-mono text-zinc-200 shrink-0">{item.p}</span>
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
  <div className="absolute inset-0 bg-black/95 backdrop-blur-lg z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
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
    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl z-[70] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
      <div className="w-12 h-12 mb-4 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
        <OctagonAlert className="text-rose-500 animate-pulse" size={24} />
      </div>
      <h3 className="text-lg font-black italic text-white uppercase tracking-tighter mb-4">Pipeline Exhausted</h3>
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 w-full max-w-sm overflow-hidden text-left">
        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed truncate">{message}</p>
      </div>
      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={onRetry} className="flex-1 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-zinc-200 transition-all">Retry</button>
        <button onClick={onDismiss} className="flex-1 py-3 border border-zinc-800 text-zinc-500 font-black uppercase text-[10px] tracking-widest rounded-lg hover:border-zinc-400 transition-all">Dismiss</button>
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
      className="group flex items-center justify-between p-3 bg-zinc-950/40 border border-white/5 rounded-xl hover:border-emerald-500/40 hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer gap-3 overflow-hidden shadow-md relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-3 min-w-0 flex-1 text-left relative z-10">
        <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center font-black italic text-zinc-600 group-hover:text-emerald-500 group-hover:scale-105 transition-all text-[8px] shrink-0 uppercase tracking-tighter">
          {ticker.substring(0, 4)}
        </div>
        <div className="min-w-0">
          <h4 className="font-black italic text-xs text-zinc-200 group-hover:text-white transition-colors truncate uppercase leading-tight">{ticker}</h4>
          <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-[0.1em] truncate">{name}</p>
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
    <div className="p-4 bg-zinc-900/20 rounded-xl border border-white/5 space-y-3 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform"><Flame size={40} /></div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em]">Risk Status</span>
        <Flame size={10} className="text-orange-500 animate-pulse" />
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-emerald-500 rounded-full opacity-20" />
        <div className="flex-1 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
        <div className="flex-1 bg-rose-500 rounded-full opacity-10 animate-flicker" />
      </div>
      <div className="flex justify-between text-[7px] font-mono text-zinc-600">
        <span>VIX_INDEX: 18.2</span>
        <span className="text-yellow-500/80 uppercase font-bold tracking-tighter">NEUTRAL_MARKET</span>
      </div>
    </div>
  );
};

const TeamCredits: React.FC = () => {
  const members = [
    "Abdullah Rashid",
    "Moawiz",
    "Muhammad Abdullah"
  ];

  return (
    <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users size={12} className="text-zinc-700" />
        <span className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">Team</span>
      </div>
      <div className="space-y-1.5 px-1 text-left">
        {members.map((name, i) => (
          <div key={i} className="flex flex-col group/member">
            <span className="text-[11px] font-bold text-zinc-500 group-hover/member:text-zinc-200 transition-colors truncate">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('architect');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
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
    if (activeTab === 'pulse' && pulseItems.length === 0) handleFetchPulse();
  }, [activeTab]);

  const handleError = (e: any) => {
    setApiError(e?.message || "Communication protocol failure.");
    setLoading(false);
  };

  const handleFetchPulse = async () => {
    setLoading(true); setApiError(null);
    try { const { items, sources } = await getLogicPulse(); setPulseItems(items); setPulseSources(sources); }
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
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500/20 text-zinc-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-64 bg-[#050505] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black italic shadow-lg shrink-0 text-lg group-hover:scale-110 transition-transform">!</div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white truncate">RiskIT</h1>
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
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all group relative overflow-hidden ${activeTab === tab.id ? 'bg-zinc-900/60 text-white border border-white/10 shadow-md' : 'text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900/20'}`}
              >
                {activeTab === tab.id && <div className="absolute left-0 h-4 w-1 bg-emerald-500 rounded-full" />}
                <tab.icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : 'group-hover:text-zinc-300'} />
                <span className="font-bold uppercase text-[9px] tracking-[0.2em] truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <RiskWidget />
          <TeamCredits />
        </div>
        
        <div className="p-6 border-t border-white/5 bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-3 p-3 bg-black border border-white/5 rounded-xl mb-4 relative overflow-hidden group/status">
             <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover/status:translate-y-0 transition-transform" />
             <Cpu size={12} className={`shrink-0 z-10 ${engine !== 'DISCONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`} />
             <span className="text-[9px] font-mono text-zinc-300 font-bold tracking-tighter truncate z-10 uppercase">{engine}</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-700">
            <span>SYS_STABILITY</span>
            <span className="text-emerald-500/60 uppercase">OK</span>
          </div>
        </div>
        <button className="absolute top-6 right-6 text-zinc-600 lg:hidden p-2" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020202]">
        <TickerTape />
        
        <header className="lg:hidden h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/90 backdrop-blur-md z-[80] shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-2 rounded-lg"><Menu size={20} /></button>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-500 italic truncate">{activeTab}</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 space-y-8">
          
          {/* ARCHITECT TAB */}
          {activeTab === 'architect' && (
            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 animate-in fade-in slide-in-from-bottom-6 max-w-[1400px] mx-auto w-full">
              <div className="glass-card p-6 relative h-fit text-left flex flex-col gap-6">
                {loading && <CardLoader label="Processing..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleArchitect} onDismiss={() => setApiError(null)} />}
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">ARCHITECT</h2>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Strategy Lab</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5"><label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Asset Allocation</label><input type="number" className="field-input py-2" value={recInputs.amount} onChange={(e) => setRecInputs({ ...recInputs, amount: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Market Segment</label><input type="text" className="field-input py-2" placeholder="e.g. US Tech" value={recInputs.market} onChange={(e) => setRecInputs({ ...recInputs, market: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-zinc-500 text-[8px] font-black uppercase tracking-widest ml-1">Horizon</label><select className="field-input py-2" value={recInputs.horizon} onChange={(e) => setRecInputs({ ...recInputs, horizon: e.target.value })}><option>Short Term</option><option>Medium Term</option><option>Long Term</option></select></div>
                  
                  <div className="flex flex-col justify-center p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all group/sharia" onClick={() => setRecInputs({ ...recInputs, halal: !recInputs.halal })}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black italic uppercase ${recInputs.halal ? 'text-emerald-500' : 'text-zinc-700'}`}>Sharia Filter</span>
                      <ShieldCheck size={16} className={`${recInputs.halal ? 'text-emerald-500' : 'text-zinc-800'} group-hover/sharia:scale-110 transition-transform`} />
                    </div>
                  </div>
                </div>

                <button onClick={handleArchitect} disabled={loading} className="btn-primary w-full py-3 text-[10px] group/btn">
                  <PieChart size={14} className="group-hover/btn:rotate-12 transition-transform" />
                  <span>Generate Blueprint</span>
                </button>
              </div>

              <div className="glass-card p-6 bg-zinc-950/20 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Strategic Nodes</span>
                  <RefreshCw size={12} className={`text-zinc-800 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                </div>
                {recommendations ? (
                  <div className="space-y-6 animate-in fade-in duration-500 text-left">
                    <p className="text-base text-zinc-300 font-medium italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/[0.02] py-4 pr-4 rounded-r-xl">{recommendations.strategy}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto custom-scroll pr-2">
                      {recommendations.nodes.map((node, i) => (
                        <NodeRow key={i} {...node} onClick={() => { setActiveTab('pathfinder'); handlePathfinder(node.ticker); }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                    <div className="relative">
                      <Coins size={80} className="text-zinc-500" />
                      <div className="absolute inset-0 animate-pulse border-2 border-emerald-500/20 rounded-full scale-150" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATHFINDER TAB */}
          {activeTab === 'pathfinder' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 w-full">
              <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-6 bg-zinc-950 relative overflow-hidden group/search">
                {loading && <CardLoader label="Scanning..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handlePathfinder()} onDismiss={() => setApiError(null)} />}
                <Search className="text-zinc-800 shrink-0 group-hover/search:text-emerald-500 transition-colors" size={32} />
                <input 
                  placeholder="ENTER TICKER..." 
                  className="flex-1 bg-transparent text-2xl sm:text-4xl font-black italic uppercase outline-none placeholder:text-zinc-900 text-white tracking-tighter w-full min-w-0" 
                  value={anaInput} 
                  onChange={(e) => setAnaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePathfinder()}
                />
                <button onClick={() => handlePathfinder()} className="btn-primary w-full md:w-auto px-8 py-3 text-[10px]">Deep Scan</button>
              </div>

              {analysis && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 animate-in zoom-in-95 pb-10 text-left items-start">
                  <div className="glass-card p-6 sm:p-8 bg-zinc-950/80 border-white/5 relative overflow-hidden min-w-0">
                    <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-black italic uppercase leading-none text-white mb-2 break-words" style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)' }}>{analysis.ticker}</h2>
                        <p className="text-sm sm:text-lg text-zinc-500 font-bold uppercase tracking-widest italic truncate">{analysis.name}</p>
                      </div>

                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 shrink-0 group/health">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="44" fill="none" stroke="#09090b" strokeWidth="10" />
                              <circle 
                                cx="50" cy="50" r="44" fill="none" stroke="#10b981" strokeWidth="10" 
                                strokeDasharray="276" 
                                strokeDashoffset={276 * (1 - getNormalizedHealth(analysis.health))} 
                                strokeLinecap="round" 
                                className="transition-all duration-1000 ease-out"
                              />
                           </svg>
                           <span className="absolute text-2xl font-black italic text-emerald-500">
                             <QuantValue value={Math.round(getNormalizedHealth(analysis.health) * 100)} />
                           </span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest group-hover/health:text-emerald-500 transition-colors">Health_Index</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                      {analysis.metrics.map((m, i) => (
                        <div key={i} className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl flex flex-col min-w-0 group/metric hover:border-zinc-700 transition-colors">
                           <span className="text-[7px] font-black uppercase tracking-widest text-zinc-700 mb-0.5 truncate group-hover/metric:text-zinc-500">{m.label}</span>
                           <span className="text-sm font-black text-zinc-200 italic truncate">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-black border border-white/5 rounded-xl mb-8 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                      <p className="text-sm sm:text-base text-zinc-400 italic leading-relaxed break-words pl-2">"{analysis.desc}"</p>
                    </div>

                    {/* MARKET SENTIMENT SECTION */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Activity size={14} className="text-zinc-700" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Market Sentiment Scan</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {analysis.sentiment?.map((s, i) => (
                          <RadialSentimentChart key={i} label={s.label} score={s.score} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-card p-5 bg-zinc-950/60 space-y-4 shadow-xl">
                       <h3 className="text-[8px] font-black uppercase text-zinc-600 tracking-widest border-b border-white/5 pb-2">Risk Catalysts</h3>
                       <div className="space-y-2">
                          {analysis.catalysts.map((cat, i) => (
                            <div key={i} className="p-3 bg-black border border-white/5 rounded-lg group/cat hover:border-rose-500/20 transition-all">
                               <div className="flex items-center justify-between mb-1">
                                 <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${cat.impact === 'high' ? 'text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]'}`}>{cat.impact.toUpperCase()}</span>
                                 <AlertCircle size={10} className="text-zinc-800 group-hover/cat:text-zinc-600" />
                               </div>
                               <span className="text-[11px] font-bold text-zinc-400 italic block leading-tight group-hover/cat:text-zinc-200 transition-colors">"{cat.title}"</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="glass-card p-5 bg-zinc-950/60 space-y-4 text-left border-l-2 border-l-emerald-500/20">
                       <div className="flex items-center justify-between group/bull">
                         <div className="min-w-0"><span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">Bullish_Outlook</span><span className="text-emerald-500 font-black italic text-xs truncate block uppercase">{analysis.short}</span></div>
                         <BullIcon size={16} className="text-emerald-950/40 group-hover/bull:text-emerald-500 transition-colors" />
                       </div>
                       <div className="flex items-center justify-between pt-2 border-t border-white/5 group/stability">
                         <div className="min-w-0"><span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">Stability_Rating</span><span className="text-blue-500 font-black italic text-xs truncate block uppercase">{analysis.long}</span></div>
                         <Shield size={16} className="text-blue-950/40 group-hover/stability:text-blue-500 transition-colors" />
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPARATOR TAB */}
          {activeTab === 'comparator' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 w-full pb-20">
              <div className="flex justify-between items-center px-4 mb-4">
                 <div className="text-left">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">DUEL RESOLVER</h2>
                   <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Benchmarking</p>
                 </div>
                 <button onClick={handleClearComparator} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors text-[9px] font-black uppercase tracking-widest active:scale-95">
                   <Trash2 size={12} /> Clear All
                 </button>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 px-4 mb-8">
                {[
                  { l: "DXY vs SPX", a: "DXY", b: "SPX" },
                  { l: "BTC vs ETH", a: "BTC", b: "ETH" },
                  { l: "NVDA vs AMD", a: "NVDA", b: "AMD" },
                  { l: "TLT vs QQQ", a: "TLT", b: "QQQ" },
                ].map((d, i) => (
                  <button key={i} onClick={() => handleComparator(d.a, d.b)} className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-white/5 text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-all hover:border-emerald-500/20 active:scale-95">
                    {d.l}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center relative text-left px-4">
                {loading && <CardLoader label="Comparing..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handleComparator()} onDismiss={() => setApiError(null)} />}
                
                {/* NODE ALPHA (BLUE) */}
                <div className="glass-card p-6 bg-blue-500/[0.03] border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] hover:border-blue-500/40 group/alpha">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] italic group-hover/alpha:animate-pulse">NODE_ALPHA</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                   </div>
                   <input 
                     className="w-full bg-transparent border-b border-zinc-900 py-3 text-center text-4xl font-black italic uppercase text-blue-100 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-900" 
                     placeholder="TICKER" 
                     value={compInputs.s1} 
                     onChange={(e) => setCompInputs({ ...compInputs, s1: e.target.value.toUpperCase() })} 
                   />
                </div>

                <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 rounded-full mx-auto select-none shrink-0 border border-white/5 z-10 shadow-2xl group/vs">
                  <span className="text-zinc-600 font-black italic text-sm tracking-tighter group-hover/vs:text-zinc-400 group-hover/vs:scale-110 transition-all">VS</span>
                </div>

                {/* NODE BETA (ROSE) */}
                <div className="glass-card p-6 bg-rose-500/[0.03] border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] hover:border-rose-500/40 group/beta">
                   <div className="flex items-center justify-between mb-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                     <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] italic text-right group-hover/beta:animate-pulse">NODE_BETA</span>
                   </div>
                   <input 
                     className="w-full bg-transparent border-b border-zinc-900 py-3 text-center text-4xl font-black italic uppercase text-rose-100 outline-none focus:border-rose-500 transition-all placeholder:text-zinc-900 text-right" 
                     placeholder="TICKER" 
                     value={compInputs.s2} 
                     onChange={(e) => setCompInputs({ ...compInputs, s2: e.target.value.toUpperCase() })} 
                   />
                </div>
              </div>

              <div className="px-8 flex gap-3">
                <button onClick={() => handleComparator()} disabled={loading} className="btn-primary flex-1 py-4 text-[11px] italic font-black rounded-xl shadow-lg hover:shadow-emerald-500/10">Start Resolution Duel</button>
              </div>
              
              {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 animate-in zoom-in-95 mt-10 px-4">
                  <div className="glass-card bg-emerald-950/80 p-8 flex flex-col justify-center relative rounded-3xl border-emerald-500/30 overflow-hidden text-left shadow-2xl group/victory">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/victory:scale-125 transition-transform"><Trophy size={80} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest mb-6 text-emerald-500 animate-pulse">VICTORY_NODE</span>
                    <h2 className="font-black italic uppercase tracking-tighter leading-none text-white mb-8 break-words" style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}>{comparison.winner}</h2>
                    <div className="bg-black/80 px-4 py-2.5 rounded-xl inline-flex items-center gap-3 w-fit border border-white/10 shadow-lg group-hover/victory:border-emerald-500/30 transition-all">
                       <Zap size={16} className="text-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest truncate">{comparison.decision}</span>
                    </div>
                  </div>
                  
                  <div className="glass-card p-8 bg-zinc-950/60 border-white/5 rounded-3xl min-w-0 shadow-xl text-left">
                    <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-10 pb-4 border-b border-white/10">Neural Scorecard</h3>
                    <div className="space-y-12">
                      {comparison.scorecard.map((s, i) => (
                        <div key={i} className="space-y-4">
                          <div className="flex justify-between items-end gap-2 px-1">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[8px] font-black text-blue-500 uppercase truncate mb-1">{compInputs.s1 || 'ALPHA'}</span>
                              <span className="text-sm sm:text-lg font-black italic text-blue-100 truncate">{s.s1Value}</span>
                            </div>
                            
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pb-1.5 text-center border-b border-white/10 flex-1 mx-4 mb-1">{s.label}</span>
                            
                            <div className="flex flex-col text-right flex-1 min-w-0">
                              <span className="text-[8px] font-black text-rose-500 uppercase truncate mb-1">{compInputs.s2 || 'BETA'}</span>
                              <span className="text-sm sm:text-lg font-black italic text-rose-100 truncate">{s.s2Value}</span>
                            </div>
                          </div>
                          
                          <div className="h-2.5 flex bg-zinc-900 rounded-full overflow-hidden relative w-full shadow-inner border border-white/5 group/bar">
                             <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out" style={{ width: `${s.s1Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="h-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)] transition-all duration-1000 ease-out" style={{ width: `${s.s2Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-black/60 z-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 p-8 bg-black/60 border border-white/5 rounded-2xl relative overflow-hidden group/sum shadow-inner">
                      <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
                      <p className="text-base sm:text-lg text-zinc-400 italic leading-relaxed break-words font-medium group-hover/sum:text-zinc-200 transition-colors">"{comparison.summary}"</p>
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
                     <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">PULSE</h2>
                     <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">Live Intel Feed</p>
                  </div>
                  <button onClick={handleFetchPulse} className="w-10 h-10 glass-card items-center justify-center text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all shadow-lg hover:border-emerald-500/20"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
               </div>
               
               <div className="space-y-3 px-4">
                  {loading && <CardLoader label="Syncing..." />}
                  {apiError && <ErrorOverlay message={apiError} onRetry={handleFetchPulse} onDismiss={() => setApiError(null)} />}
                  {pulseItems.map((item, i) => (
                    <div key={i} className="group glass-card flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-zinc-900 transition-all border-l-2 border-l-zinc-900 hover:border-l-emerald-500 cursor-pointer text-left gap-4 overflow-hidden shadow-md">
                      <div className="flex items-start md:items-center gap-4 min-w-0">
                        <div className="text-left md:text-center min-w-[70px] shrink-0">
                          <span className="block font-mono text-zinc-700 text-[9px] mb-1">{item.time}</span>
                          <div className={`text-[7px] font-black px-1.5 py-0.5 rounded border inline-block ${item.impact === 'High' ? 'text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]' : 'text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'}`}>{item.impact}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-zinc-300 group-hover:text-white transition-colors text-base mb-1 uppercase italic truncate">{item.title}</h4>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{item.sector}</span>
                        </div>
                      </div>
                      <ArrowRight size={20} className="hidden md:block text-zinc-900 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  ))}
                  <SourceLink sources={pulseSources} />
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const RadialSentimentChart: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const isBullish = label.toLowerCase().includes('bull');
  const color = isBullish ? '#10b981' : '#f43f5e';
  const glowClass = isBullish ? 'animate-glow-pulse' : 'animate-flicker';
  const Icon = isBullish ? BullIcon : BearIcon;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card p-6 bg-zinc-900/40 border-white/5 flex flex-col items-center justify-center shadow-lg group/sent hover:bg-zinc-900/60 transition-all relative">
      <div className="absolute top-2 right-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={40} /></div>
      <div className="relative w-28 h-28 flex items-center justify-center mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#0f0f0f" strokeWidth="10" />
          <circle 
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10" 
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black italic tracking-tighter" style={{ color }}>
            <QuantValue value={score} />%
          </span>
          <Icon size={16} style={{ color }} className={`mt-1 ${glowClass}`} />
        </div>
      </div>
      <div className="text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200 block mb-1">{label}</span>
        <div className="w-12 h-0.5 bg-white/5 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500/20 animate-pulse" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
};

const SourceLink: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-8 pt-6 border-t border-white/5 text-left">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={12} className="text-zinc-800" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-800">Verified_Context</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((s, i) => (
          <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-lg hover:border-emerald-500/40 transition-all group overflow-hidden shadow-sm hover:shadow-emerald-500/[0.03]">
            <span className="text-[9px] text-zinc-600 group-hover:text-zinc-100 truncate pr-4 font-bold uppercase">{s.title}</span>
            <ExternalLink size={10} className="text-zinc-800 group-hover:text-emerald-500 transition-colors shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
