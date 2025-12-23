
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Scale, Target, Radio, Menu, X, ArrowRight,
  RefreshCw, Trophy, Search, Network, 
  ShieldCheck, Globe, BarChart3, Activity, ExternalLink,
  Zap, Shield, Flame, ChevronRight, AlertCircle,
  Gauge, TrendingUp as BullIcon, TrendingDown as BearIcon, OctagonAlert,
  Cpu, Sword, Gem, Landmark, PieChart, Coins
} from 'lucide-react';
import { 
  TabType, RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource 
} from './types';
import { 
  getArchitectStrategy, getComparison, getAnalysis, getLogicPulse, getApiKeyHint, getEngineStatus 
} from './services/geminiService';

// --- Shared Components ---

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
    <div className="h-10 bg-black/80 backdrop-blur-md border-b border-white/5 overflow-hidden flex items-center group sticky top-0 z-50 shrink-0">
      <div className="flex animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-8 border-r border-white/5 h-10 shrink-0">
            <span className="text-[10px] font-black italic text-zinc-500 tracking-tighter uppercase shrink-0">{item.s}</span>
            <span className="text-[10px] font-mono text-zinc-200 shrink-0">{item.p}</span>
            <span className={`text-[9px] font-bold shrink-0 ${item.u ? 'text-emerald-500' : 'text-rose-500'}`}>
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
    <div className="w-12 h-12 mb-6 relative">
      <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
      <RefreshCw className="text-emerald-500 animate-spin absolute inset-0 m-auto" size={24} />
    </div>
    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2 animate-pulse">{label}</span>
    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">Cross-referencing global indices via real-time architecture protocols...</span>
  </div>
);

const ErrorOverlay: React.FC<{ message: string; onRetry: () => void; onDismiss: () => void }> = ({ message, onRetry, onDismiss }) => {
  const isQuota = message.includes('429');
  const isKeyError = message.includes('403') || message.includes('400') || message.includes('INVALID') || message.includes('GROQ_ERROR') || message.includes('API_KEY_INVALID');
  const keyHint = getApiKeyHint();
  
  return (
    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl z-[70] flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in zoom-in-95">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
        <OctagonAlert className="text-rose-500 animate-pulse" size={32} />
      </div>
      <h3 className="text-xl sm:text-2xl font-black italic text-white uppercase tracking-tighter mb-4">Logic Pipeline Exhausted</h3>
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 w-full max-w-md max-h-[150px] overflow-y-auto custom-scroll">
        <p className="text-[10px] font-mono text-rose-500 mb-2 font-bold uppercase tracking-widest text-left">Detected Provider Error:</p>
        <p className="text-[11px] text-zinc-400 font-medium text-left leading-relaxed break-words">{message}</p>
      </div>
      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={onRetry} className="flex-1 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all">Retry</button>
        <button onClick={onDismiss} className="flex-1 py-4 border border-zinc-800 text-zinc-500 font-black uppercase text-[11px] tracking-widest rounded-xl hover:border-zinc-400 transition-all">Dismiss</button>
      </div>
    </div>
  );
};

const NodeRow: React.FC<{ ticker: string; name: string; trend: number[]; onClick?: () => void }> = ({ ticker, name, trend, onClick }) => {
  const points = trend.map((val, i) => {
    const x = (i / (trend.length - 1)) * 100;
    const y = 100 - ((val - Math.min(...trend)) / (Math.max(...trend) - Math.min(...trend) || 1)) * 100;
    return `${x},${y}`;
  }).join(' L ');

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-3 sm:p-4 bg-zinc-950/40 border border-white/5 rounded-xl hover:border-emerald-500/40 hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer gap-4 overflow-hidden"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-black border border-white/5 flex items-center justify-center font-black italic text-zinc-700 group-hover:text-emerald-500 transition-all text-[10px] shrink-0 uppercase">
          {ticker.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <h4 className="font-black italic text-sm sm:text-base text-zinc-200 group-hover:text-white transition-colors truncate uppercase leading-none mb-1">{ticker}</h4>
          <p className="text-[8px] sm:text-[9px] text-zinc-600 font-bold uppercase tracking-widest truncate">{name}</p>
        </div>
      </div>
      <div className="w-12 sm:w-20 h-8 shrink-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d={`M ${points}`} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]" />
        </svg>
      </div>
    </div>
  );
};

const RiskWidget: React.FC = () => {
  const segments = [
    { color: 'bg-emerald-500', label: 'SAFE' },
    { color: 'bg-emerald-400', label: '' },
    { color: 'bg-yellow-500', label: 'MID' },
    { color: 'bg-orange-500', label: '' },
    { color: 'bg-rose-500', label: 'HIGH' },
  ];
  return (
    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Global Risk Heat</span>
        <Flame size={12} className="text-orange-500 animate-pulse" />
      </div>
      <div className="flex gap-1 h-2">
        {segments.map((s, i) => (
          <div key={i} className={`flex-1 ${s.color} rounded-full opacity-40 hover:opacity-100 transition-opacity cursor-help relative group`}>
            {s.label && <span className="absolute -top-4 left-0 text-[7px] font-black text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">{s.label}</span>}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[8px] font-mono text-zinc-500">
        <span>VOLATILITY_STREAM: 2.4%</span>
        <span>MODERATE</span>
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

  // Inputs
  const [recInputs, setRecInputs] = useState({ amount: '50000', market: 'S&P 500', horizon: 'Medium Term', halal: true });
  const [compInputs, setCompInputs] = useState({ s1: '', s2: '' });
  const [anaInput, setAnaInput] = useState('');

  // Results
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [pulseItems, setPulseItems] = useState<any[]>([]);
  const [pulseSources, setPulseSources] = useState<GroundingSource[]>([]);

  useEffect(() => {
    if (activeTab === 'pulse' && pulseItems.length === 0) handleFetchPulse();
  }, [activeTab]);

  const handleError = (e: any) => {
    console.error("AI_ERROR:", e);
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
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500/20">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-[#050505] border-r border-white/5 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center gap-4 mb-14 group cursor-pointer">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black italic shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">!</div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white truncate">RiskIT</h1>
          </div>
          
          <nav className="space-y-1.5 mb-10">
            {[
              { id: 'architect', label: 'Architect', icon: LayoutDashboard },
              { id: 'comparator', label: 'Comparator', icon: Scale },
              { id: 'pathfinder', label: 'Pathfinder', icon: Target },
              { id: 'pulse', label: 'Pulse', icon: Radio },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); setApiError(null); }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all group relative overflow-hidden ${activeTab === tab.id ? 'bg-zinc-900/60 text-white border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20'}`}
              >
                {activeTab === tab.id && <div className="absolute left-0 h-6 w-1 bg-emerald-500 rounded-full" />}
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-500' : 'group-hover:text-zinc-300'} />
                <span className="font-bold uppercase text-[10px] tracking-widest truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <RiskWidget />
        </div>
        
        <div className="p-8 border-t border-white/5 bg-zinc-950/20 shrink-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3 text-left">Active Engine</p>
          <div className="flex items-center gap-3 p-3 bg-black border border-white/5 rounded-xl overflow-hidden mb-8">
             <Cpu size={14} className={`shrink-0 ${engine !== 'DISCONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`} />
             <span className="text-[10px] font-mono text-zinc-300 font-bold tracking-tighter truncate">{engine}</span>
          </div>
          <div className="space-y-2 font-mono text-[9px] text-zinc-600">
            <div className="flex justify-between"><span>SYS_LATENCY</span><span className="text-emerald-500">22ms</span></div>
            <div className="flex justify-between"><span>LOG_NODES</span><span className="text-zinc-300">10 ACTIVE</span></div>
          </div>
        </div>
        <button className="absolute top-8 right-8 text-zinc-600 lg:hidden" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020202]">
        <TickerTape />
        
        <header className="lg:hidden h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/90 backdrop-blur-md z-40 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-2"><Menu size={24} /></button>
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-500 italic truncate">{activeTab}</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 lg:p-14 space-y-12">
          
          {/* ARCHITECT TAB */}
          {activeTab === 'architect' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.8fr] gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-6 max-w-[1600px] mx-auto w-full">
              <div className="glass-card p-6 sm:p-10 relative h-fit text-left">
                {loading && <CardLoader label="Executing Stock Architecture Protocol..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleArchitect} onDismiss={() => setApiError(null)} />}
                <h2 className="title-fluid leading-none mb-10">ARCHITECT</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-2"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Asset Allocation</label><input type="number" className="field-input" value={recInputs.amount} onChange={(e) => setRecInputs({ ...recInputs, amount: e.target.value })} /></div>
                  <div className="space-y-2"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Market Sector</label><input type="text" className="field-input" placeholder="e.g. AI Tech, EU Energy" value={recInputs.market} onChange={(e) => setRecInputs({ ...recInputs, market: e.target.value })} /></div>
                  <div className="space-y-2"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Timeline</label><select className="field-input" value={recInputs.horizon} onChange={(e) => setRecInputs({ ...recInputs, horizon: e.target.value })}><option>Short Term</option><option>Medium Term</option><option>Long Term</option></select></div>
                  <div className="flex flex-col justify-center gap-1 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl cursor-pointer group transition-all" onClick={() => setRecInputs({ ...recInputs, halal: !recInputs.halal })}>
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Logic Filter</label>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${recInputs.halal ? 'text-emerald-500' : 'text-zinc-700'}`}>Sharia Mode</span>
                      <ShieldCheck size={16} className={recInputs.halal ? 'text-emerald-500' : 'text-zinc-800'} />
                    </div>
                  </div>
                </div>
                <button onClick={handleArchitect} disabled={loading} className="btn-primary w-full group py-5">
                  <PieChart size={16} />
                  <span>Build Top 10 Portfolio</span>
                </button>
              </div>

              <div className="glass-card p-6 sm:p-10 bg-zinc-950/30 min-h-[500px]">
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Quantum Inventory (10 Nodes)</span>
                  </div>
                  <RefreshCw size={14} className={`text-zinc-800 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                </div>
                {recommendations ? (
                  <div className="space-y-10 animate-in fade-in text-left">
                    <p className="text-lg sm:text-2xl text-zinc-300 font-medium italic leading-relaxed pl-6 border-l-2 border-emerald-500/30 break-words">"{recommendations.strategy}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scroll pr-2">
                      {recommendations.nodes.map((node, i) => (
                        <NodeRow key={i} {...node} onClick={() => { setActiveTab('pathfinder'); handlePathfinder(node.ticker); }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[350px] opacity-10">
                    <Coins size={80} className="mb-6" />
                    <p className="text-xl sm:text-2xl font-black italic tracking-tighter text-center uppercase">System Idle: Waiting for Market Query</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATHFINDER TAB */}
          {activeTab === 'pathfinder' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 w-full">
              <div className="glass-card flex flex-col md:flex-row items-center gap-6 p-6 sm:p-10 bg-zinc-950 border-emerald-500/10 relative group overflow-hidden">
                {loading && <CardLoader label="Executing Deep Scan..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handlePathfinder()} onDismiss={() => setApiError(null)} />}
                <Search className="text-zinc-800 group-hover:text-emerald-500/50 transition-colors shrink-0" size={40} />
                <input 
                  placeholder="SEARCH TICKER..." 
                  className="flex-1 bg-transparent text-3xl sm:text-5xl md:text-7xl font-black italic uppercase outline-none placeholder:text-zinc-900 text-white tracking-tighter w-full min-w-0" 
                  value={anaInput} 
                  onChange={(e) => setAnaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePathfinder()}
                />
                <button onClick={() => handlePathfinder()} className="btn-primary w-full md:w-auto px-12 h-16 sm:h-20 shadow-xl shadow-emerald-500/10 font-black italic">Deep Scan</button>
              </div>

              {analysis ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-8 animate-in zoom-in-95 pb-20 text-left items-start">
                  <div className="glass-card p-6 sm:p-14 bg-gradient-to-br from-[#0c0c0c] to-black border-white/5 relative overflow-hidden min-w-0">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none -z-10"><Sword size={400} /></div>
                    
                    <div className="flex flex-col sm:flex-row gap-8 mb-20 relative z-10 items-start sm:items-center">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6 w-fit">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Logic Resolved via {engine}</span>
                        </div>
                        <h2 className="font-black italic uppercase leading-[0.85] tracking-tighter text-white mb-4 break-words hyphens-auto" style={{ fontSize: 'clamp(2.5rem, 12vw, 6.5rem)' }}>{analysis.ticker}</h2>
                        <p className="text-lg sm:text-3xl text-zinc-500 font-bold uppercase tracking-[0.2em] break-words leading-tight">{analysis.name}</p>
                      </div>

                      <div className="bg-black/60 p-6 sm:p-10 rounded-[3rem] border border-white/5 flex flex-col items-center gap-4 shadow-2xl relative shrink-0 w-full sm:w-auto">
                        <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="44" fill="none" stroke="#09090b" strokeWidth="10" />
                              <circle 
                                cx="50" cy="50" r="44" fill="none" stroke="#10b981" strokeWidth="10" 
                                strokeDasharray="276.46" 
                                strokeDashoffset={276.46 * (1 - getNormalizedHealth(analysis.health))} 
                                strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                              />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-5xl sm:text-8xl font-black italic tabular-nums leading-none text-emerald-500">
                               {Math.round(getNormalizedHealth(analysis.health) * 100)}
                             </span>
                             <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-2">Health index</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mb-20 relative z-10">
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em] ml-1 flex items-center gap-2">
                        <Gauge size={14} className="text-emerald-500 shrink-0" /> Financial Intelligence Matrix
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {analysis.metrics.map((m, i) => (
                          <div key={i} className="flex flex-col p-6 bg-zinc-950/60 border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all hover:bg-zinc-900/40 min-w-0 shadow-lg">
                             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2 truncate">{m.label}</span>
                             <div className="flex items-center justify-between gap-2 overflow-hidden">
                               <span className="text-xl sm:text-2xl font-black text-zinc-200 italic tracking-tighter truncate">{m.value}</span>
                               <div className={`p-1.5 rounded-full shrink-0 ${m.status === 'positive' ? 'text-emerald-500 bg-emerald-500/10' : m.status === 'negative' ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-600 bg-zinc-600/10'}`}>
                                 <Activity size={14} />
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 sm:p-12 bg-black/80 rounded-[3rem] border border-white/5 relative z-10 mb-16 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                      <div className="absolute -top-5 -left-5 w-14 h-14 bg-zinc-900 flex items-center justify-center border border-white/10 rounded-2xl"><Network size={20} className="text-blue-500" /></div>
                      <p className="text-2xl sm:text-4xl italic text-zinc-300 font-medium leading-relaxed break-words">"{analysis.desc}"</p>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em] ml-1 flex items-center gap-2">
                        <Flame size={14} className="text-orange-500 shrink-0" /> Market Sentiment Pulse
                      </h3>
                      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                        {analysis.sentiment?.map((s, i) => (
                          <RadialSentimentChart key={i} label={s.label} score={s.score} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-8 w-full sticky top-14">
                    <div className="glass-card p-8 sm:p-12 bg-zinc-950/40 space-y-12">
                       <div className="space-y-6">
                         <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em] ml-1 flex items-center gap-2">
                           <Zap size={14} className="text-blue-500 shrink-0" /> Risk Catalysts
                         </h3>
                         <div className="space-y-4">
                            {analysis.catalysts.map((cat, i) => (
                              <div key={i} className="flex flex-col p-6 bg-black border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all shadow-xl overflow-hidden relative">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className={`text-[9px] font-black px-3 py-1 rounded-full border ${cat.impact === 'high' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : cat.impact === 'medium' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5'}`}>
                                      {cat.impact.toUpperCase()} IMPACT
                                   </div>
                                   <AlertCircle size={16} className="text-zinc-800 group-hover:text-zinc-400 transition-colors" />
                                 </div>
                                 <span className="text-base sm:text-lg font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight italic">"{cat.title}"</span>
                              </div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="space-y-5 pt-12 border-t border-white/5">
                          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em] ml-1">Logic Vectors</h3>
                          <div className="grid grid-cols-1 gap-4">
                             <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all gap-6 shadow-2xl">
                                <div className="min-w-0"><span className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 truncate">Bull Horizon</span><span className="text-emerald-400 font-black italic text-2xl uppercase tracking-tighter truncate block">{analysis.short}</span></div>
                                <BullIcon size={32} className="text-emerald-950 group-hover:text-emerald-500/20 transition-colors shrink-0" />
                             </div>
                             <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all gap-6 shadow-2xl">
                                <div className="min-w-0"><span className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 truncate">Core Stability</span><span className="text-blue-400 font-black italic text-2xl uppercase tracking-tighter truncate block">{analysis.long}</span></div>
                                <Shield size={32} className="text-blue-950 group-hover:text-blue-500/20 transition-colors shrink-0" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[500px] glass-card opacity-20 border-dashed border-zinc-800 bg-zinc-950/20">
                    <Target size={100} className="mb-8" />
                    <p className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase">Initializing Deep Scan Environment...</p>
                </div>
              )}
            </div>
          )}

          {/* COMPARATOR TAB */}
          {activeTab === 'comparator' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 w-full pb-32">
              <div className="text-center px-4 mb-20">
                 <h2 className="title-fluid mb-6">DUEL RESOLVER</h2>
                 <p className="text-[10px] sm:text-[12px] font-black text-zinc-600 uppercase tracking-[0.5em] break-words">High-Precision Benchmarking ({engine})</p>
                 
                 <div className="mt-12 flex flex-wrap justify-center gap-3">
                    <span className="text-[9px] font-black uppercase text-zinc-700 w-full mb-2 tracking-widest">Market Standard Duels</span>
                    {[
                      { l: "S&P 500 vs NASDAQ", a: "SPX", b: "NDX" },
                      { l: "BTC vs GOLD", a: "BTC", b: "XAU" },
                      { l: "NVDA vs AMD", a: "NVDA", b: "AMD" },
                      { l: "MSFT vs AAPL", a: "MSFT", b: "AAPL" },
                    ].map((d, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleComparator(d.a, d.b)}
                        className="px-5 py-2.5 rounded-full bg-zinc-900/50 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all flex items-center gap-2"
                      >
                        <Sword size={10} /> {d.l}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-10 items-center relative text-left">
                {loading && <CardLoader label="Executing Logical Resolution Duel..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handleComparator()} onDismiss={() => setApiError(null)} />}
                <div className="glass-card p-8 sm:p-14 bg-blue-500/5 border-blue-500/20 shadow-2xl">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block mb-8">ALPHA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-6 text-center text-4xl sm:text-7xl font-black italic uppercase text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-900" placeholder="TICKER A" value={compInputs.s1} onChange={(e) => setCompInputs({ ...compInputs, s1: e.target.value.toUpperCase() })} />
                </div>
                <div className="text-zinc-800 font-black italic text-4xl sm:text-6xl px-8 py-5 border-2 border-zinc-900 rounded-full mx-auto select-none shrink-0 bg-black z-10 shadow-[0_0_50px_rgba(0,0,0,1)]">VS</div>
                <div className="glass-card p-8 sm:p-14 bg-rose-500/5 border-rose-500/20 shadow-2xl">
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] block mb-8 text-right">BETA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-6 text-center text-4xl sm:text-7xl font-black italic uppercase text-white outline-none focus:border-rose-500 transition-colors placeholder:text-zinc-900 text-right" placeholder="TICKER B" value={compInputs.s2} onChange={(e) => setCompInputs({ ...compInputs, s2: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className="px-4"><button onClick={() => handleComparator()} disabled={loading} className="btn-primary w-full py-6 text-sm italic font-black shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20">Execute Duel Analysis</button></div>
              
              {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 animate-in zoom-in-95 pb-20 text-left items-start">
                  <div className="glass-card bg-emerald-950 p-10 sm:p-16 text-zinc-100 flex flex-col justify-center relative overflow-hidden shadow-2xl border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -z-10"><Trophy size={180} /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] mb-8 text-emerald-500">Duel Superiority Detected</span>
                    <h2 className="font-black italic uppercase tracking-tighter mb-12 leading-none break-all" style={{ fontSize: 'clamp(3rem, 12vw, 8rem)' }}>{comparison.winner}</h2>
                    <div className="bg-black/90 text-white px-8 py-4 rounded-[2rem] inline-flex items-center gap-4 w-fit shadow-2xl border border-white/10 max-w-full">
                       <Zap size={24} className="text-emerald-500 shrink-0" />
                       <span className="text-sm sm:text-lg font-black italic uppercase tracking-widest break-words">{comparison.decision}</span>
                    </div>
                  </div>
                  
                  <div className="glass-card p-10 sm:p-16 bg-zinc-950/60 border-emerald-500/10 min-w-0 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em] mb-14 border-b border-white/5 pb-6">Quantitative Divergence Scorecard</h3>
                    <div className="space-y-14">
                      {comparison.scorecard.map((s, i) => (
                        <div key={i} className="space-y-6 group">
                          <div className="flex justify-between items-end px-1 gap-6">
                            <div className="flex flex-col min-w-0 flex-1"><span className="text-[9px] font-black text-blue-500 uppercase mb-2 truncate">{compInputs.s1 || 'ALPHA'}</span><span className="text-sm sm:text-lg font-black italic text-zinc-100 truncate">{s.s1Value}</span></div>
                            <span className="text-[10px] sm:text-[12px] font-black text-zinc-600 uppercase tracking-widest pb-1 text-center shrink-0 w-32 sm:w-48 border-b border-white/5 mb-1">{s.label}</span>
                            <div className="flex flex-col text-right min-w-0 flex-1"><span className="text-[9px] font-black text-rose-500 uppercase mb-2 truncate">{compInputs.s2 || 'BETA'}</span><span className="text-sm sm:text-lg font-black italic text-zinc-100 truncate">{s.s2Value}</span></div>
                          </div>
                          <div className="h-2 flex bg-zinc-900/50 rounded-full overflow-hidden relative w-full shadow-inner">
                             <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${s.s1Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="h-full bg-rose-600 transition-all duration-1000 shadow-[0_0_15px_rgba(225,29,72,0.4)]" style={{ width: `${s.s2Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-black/50 z-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-16 p-8 sm:p-12 bg-black/80 rounded-[3rem] border border-white/5 text-lg sm:text-xl text-zinc-300 italic leading-relaxed break-words shadow-2xl">"{comparison.summary}"</p>
                    <SourceLink sources={comparison.sources || []} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PULSE TAB */}
          {activeTab === 'pulse' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 w-full pb-32">
               <div className="flex flex-wrap justify-between items-end gap-8 mb-16 text-left px-4">
                  <div className="space-y-4 min-w-[300px]">
                     <h2 className="title-fluid">LOGIC PULSE</h2>
                     <p className="text-[10px] sm:text-[14px] font-black text-zinc-600 uppercase tracking-[0.5em] break-words">Real-Time Strategic Intel Feed</p>
                  </div>
                  <button onClick={handleFetchPulse} className="w-16 h-16 glass-card items-center justify-center text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all shrink-0 shadow-2xl border-white/10"><RefreshCw size={28} className={loading ? 'animate-spin' : ''} /></button>
               </div>
               
               <div className="space-y-6 relative px-4">
                  {loading && <CardLoader label="Syncing Logic Streams..." />}
                  {apiError && <ErrorOverlay message={apiError} onRetry={handleFetchPulse} onDismiss={() => setApiError(null)} />}
                  {pulseItems.map((item, i) => (
                    <div key={i} className="group glass-card flex flex-col sm:flex-row sm:items-center justify-between p-8 sm:p-10 hover:bg-zinc-900/40 transition-all border-l-4 border-l-zinc-900 hover:border-l-emerald-500 cursor-pointer text-left gap-8 overflow-hidden shadow-lg hover:shadow-emerald-500/5">
                      <div className="flex items-start sm:items-center gap-8 sm:gap-14 min-w-0">
                        <div className="text-left sm:text-center min-w-[90px] sm:min-w-[110px] shrink-0">
                          <span className="block font-mono text-zinc-600 text-[10px] sm:text-[11px] mb-3">{item.time}</span>
                          <div className={`text-[9px] font-black px-3 py-1.5 rounded border inline-block sm:block ${item.impact === 'High' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'}`}>{item.impact.toUpperCase()} IMPACT</div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-zinc-200 group-hover:text-white transition-colors text-xl sm:text-3xl mb-3 uppercase tracking-tight italic line-clamp-2 leading-tight break-words">{item.title}</h4>
                          <div className="flex items-center gap-4">
                             <div className="badge px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.sector}</div>
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0" />
                             <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest shrink-0 opacity-50">QUANT_INTEL</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={32} className="hidden sm:block text-zinc-900 group-hover:text-emerald-500 group-hover:translate-x-4 transition-all shrink-0 ml-6" />
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
  const Icon = isBullish ? BullIcon : BearIcon;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] flex flex-col items-center group hover:border-white/20 transition-all min-w-[180px] shadow-xl hover:-translate-y-1">
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#161616" strokeWidth="10" />
          <circle 
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10" 
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={24} style={{ color }} className="mb-2" />
          <span className="text-2xl sm:text-3xl font-black italic" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 text-center leading-relaxed">{label}</span>
    </div>
  );
};

const SourceLink: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-12 pt-8 border-t border-white/5 text-left">
      <div className="flex items-center gap-3 mb-6">
        <Globe size={14} className="text-zinc-600" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Verification Intelligence Path</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((s, i) => (
          <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-zinc-950/80 border border-white/5 rounded-2xl hover:border-emerald-500/30 hover:bg-zinc-900 transition-all group overflow-hidden">
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-200 truncate pr-6 font-medium">{s.title}</span>
            <ExternalLink size={12} className="text-zinc-700 group-hover:text-emerald-500 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
