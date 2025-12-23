
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Scale, Target, Radio, Menu, X, ArrowRight,
  RefreshCw, Trophy, Search, Network, 
  ShieldCheck, Globe, BarChart3, Activity, ExternalLink,
  Zap, Shield, Flame, ChevronRight, AlertCircle,
  Gauge, TrendingUp as BullIcon, TrendingDown as BearIcon, OctagonAlert,
  Cpu, Sword, Gem, Landmark, PieChart, Coins, Users, Layers
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
    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">Cross-referencing global indices via neural logic...</span>
  </div>
);

const ErrorOverlay: React.FC<{ message: string; onRetry: () => void; onDismiss: () => void }> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl z-[70] flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in zoom-in-95">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
        <OctagonAlert className="text-rose-500 animate-pulse" size={32} />
      </div>
      <h3 className="text-xl sm:text-2xl font-black italic text-white uppercase tracking-tighter mb-4">Logic Pipeline Exhausted</h3>
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 w-full max-w-md max-h-[150px] overflow-y-auto custom-scroll">
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
  // --- SYNTHETIC VOLATILITY ENGINE ---
  // If the array is flat or mostly flat, we inject microscopic non-linear jitter for a "live" feel.
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
      className="group flex items-center justify-between p-4 bg-zinc-950/40 border border-white/5 rounded-2xl hover:border-emerald-500/40 hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer gap-4 overflow-hidden shadow-lg hover:shadow-emerald-500/5"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center font-black italic text-zinc-600 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all text-[9px] shrink-0 uppercase tracking-tighter">
          {ticker.substring(0, 4)}
        </div>
        <div className="min-w-0">
          <h4 className="font-black italic text-sm sm:text-base text-zinc-200 group-hover:text-white transition-colors truncate uppercase leading-tight mb-1">{ticker}</h4>
          <p className="text-[8px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-[0.1em] truncate">{name}</p>
        </div>
      </div>
      <div className="w-16 sm:w-28 h-10 shrink-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <path 
            d={`M ${points}`} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700" 
          />
        </svg>
      </div>
    </div>
  );
};

const RiskWidget: React.FC = () => {
  return (
    <div className="p-5 bg-zinc-900/20 rounded-[2rem] border border-white/5 space-y-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">Volatility Heatmap</span>
        <Flame size={12} className="text-orange-500 animate-pulse" />
      </div>
      <div className="flex gap-1.5 h-2">
        <div className="flex-1 bg-emerald-500 rounded-full opacity-20" />
        <div className="flex-1 bg-emerald-400 rounded-full opacity-20" />
        <div className="flex-1 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
        <div className="flex-1 bg-orange-500 rounded-full opacity-20" />
        <div className="flex-1 bg-rose-500 rounded-full opacity-20" />
      </div>
      <div className="flex justify-between text-[8px] font-mono text-zinc-600">
        <span>VIX_LEVEL: 18.24</span>
        <span className="text-yellow-500/80 uppercase">NEUTRAL_CAUTION</span>
      </div>
    </div>
  );
};

const TeamCredits: React.FC = () => {
  const members = [
    { name: "Abdullah Rashid", role: "Logic Architect" },
    { name: "Moawiz", role: "Systems Engineer" },
    { name: "Muhammad Abdullah", role: "Data Scientist" }
  ];

  return (
    <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={12} className="text-zinc-700" />
        <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.3em]">Neural Architects</span>
      </div>
      <div className="space-y-3">
        {members.map((m, i) => (
          <div key={i} className="group flex flex-col items-start px-2 py-1 hover:bg-white/5 rounded-lg transition-all cursor-default">
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors truncate w-full">{m.name}</span>
            <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">{m.role}</span>
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
    if (s1 && s2) {
      setCompInputs({ s1, s2 });
      // Minor delay to ensure state updates before call
    }
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
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500/20 text-zinc-100">
      {/* Responsive Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-[#050505] border-r border-white/5 flex flex-col transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center gap-4 mb-14 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black font-black italic shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform shrink-0">!</div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white truncate">RiskIT</h1>
          </div>
          
          <nav className="space-y-2 mb-10">
            {[
              { id: 'architect', label: 'Architect', icon: LayoutDashboard },
              { id: 'comparator', label: 'Comparator', icon: Scale },
              { id: 'pathfinder', label: 'Pathfinder', icon: Target },
              { id: 'pulse', label: 'Pulse', icon: Radio },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); setApiError(null); }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group relative overflow-hidden ${activeTab === tab.id ? 'bg-zinc-900/60 text-white border border-white/10 shadow-lg' : 'text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900/20'}`}
              >
                {activeTab === tab.id && <div className="absolute left-0 h-6 w-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />}
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-500' : 'group-hover:text-zinc-300'} />
                <span className="font-bold uppercase text-[10px] tracking-[0.3em] truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <RiskWidget />
          <TeamCredits />
        </div>
        
        <div className="p-8 border-t border-white/5 bg-zinc-950/20 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Active Engine</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-black border border-white/5 rounded-2xl overflow-hidden mb-8 relative shadow-inner">
             <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse" />
             <Cpu size={14} className={`shrink-0 z-10 ${engine !== 'DISCONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`} />
             <span className="text-[10px] font-mono text-zinc-300 font-bold tracking-tighter truncate z-10">{engine}</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-zinc-700">
            <span>SYS_STABILITY</span>
            <span className="text-emerald-500/60">NOMINAL</span>
          </div>
        </div>
        <button className="absolute top-8 right-8 text-zinc-600 lg:hidden p-2 hover:bg-zinc-900 rounded-full" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020202]">
        <TickerTape />
        
        {/* Mobile Header */}
        <header className="lg:hidden h-20 border-b border-white/5 flex items-center justify-between px-6 bg-black/90 backdrop-blur-md z-[80] shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-3 bg-zinc-900/50 rounded-xl"><Menu size={24} /></button>
          <span className="text-[12px] font-black tracking-[0.4em] uppercase text-emerald-500 italic truncate ml-4">{activeTab}</span>
          <div className="w-12" />
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 lg:p-14 space-y-12">
          
          {/* ARCHITECT TAB */}
          {activeTab === 'architect' && (
            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 md:gap-14 animate-in fade-in slide-in-from-bottom-10 max-w-[1600px] mx-auto w-full">
              <div className="glass-card p-8 sm:p-12 relative h-fit text-left flex flex-col gap-10">
                {loading && <CardLoader label="Synthesizing Quant Nodes..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleArchitect} onDismiss={() => setApiError(null)} />}
                
                <div className="space-y-4">
                  <h2 className="title-fluid leading-none">ARCHITECT</h2>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Multi-Asset Portfolio Logic</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Asset Allocation ($)</label><input type="number" className="field-input h-14 text-lg" value={recInputs.amount} onChange={(e) => setRecInputs({ ...recInputs, amount: e.target.value })} /></div>
                  <div className="space-y-3"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Market Segment</label><input type="text" className="field-input h-14" placeholder="e.g. Pakistan Stocks" value={recInputs.market} onChange={(e) => setRecInputs({ ...recInputs, market: e.target.value })} /></div>
                  <div className="space-y-3"><label className="text-zinc-500 text-[9px] font-black uppercase tracking-widest ml-1">Time Horizon</label><select className="field-input h-14" value={recInputs.horizon} onChange={(e) => setRecInputs({ ...recInputs, horizon: e.target.value })}><option>Short Term</option><option>Medium Term</option><option>Long Term</option></select></div>
                  
                  <div className="flex flex-col justify-center gap-2 p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl cursor-pointer group transition-all hover:border-emerald-500/30" onClick={() => setRecInputs({ ...recInputs, halal: !recInputs.halal })}>
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Ethical Core</label>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black italic uppercase ${recInputs.halal ? 'text-emerald-500' : 'text-zinc-700'}`}>Sharia Filter</span>
                      <ShieldCheck size={20} className={recInputs.halal ? 'text-emerald-500' : 'text-zinc-800'} />
                    </div>
                  </div>
                </div>

                <button onClick={handleArchitect} disabled={loading} className="btn-primary w-full group py-6 rounded-2xl text-[12px] shadow-2xl shadow-emerald-500/10">
                  <PieChart size={18} />
                  <span>Build Portfolio Blueprint</span>
                </button>
              </div>

              <div className="glass-card p-8 sm:p-12 bg-zinc-950/40 min-h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em]">High-Conviction Inventory (10)</span>
                  </div>
                  <RefreshCw size={16} className={`text-zinc-800 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                </div>
                {recommendations ? (
                  <div className="space-y-12 animate-in fade-in duration-700 text-left">
                    <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Layers size={100} /></div>
                      <p className="text-xl sm:text-3xl text-zinc-200 font-medium italic leading-relaxed break-words relative z-10">"{recommendations.strategy}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.nodes.map((node, i) => (
                        <NodeRow key={i} {...node} onClick={() => { setActiveTab('pathfinder'); handlePathfinder(node.ticker); }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-[0.05]">
                    <Coins size={120} className="mb-8" />
                    <p className="text-3xl sm:text-5xl font-black italic tracking-tighter text-center uppercase">System Awaiting Protocol</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATHFINDER TAB */}
          {activeTab === 'pathfinder' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 w-full">
              <div className="glass-card flex flex-col md:flex-row items-center gap-6 p-8 sm:p-12 bg-zinc-950 border-emerald-500/10 relative group overflow-hidden shadow-2xl">
                {loading && <CardLoader label="Executing Deep Neural Scan..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handlePathfinder()} onDismiss={() => setApiError(null)} />}
                <Search className="text-zinc-800 group-hover:text-emerald-500/50 transition-colors shrink-0" size={48} />
                <input 
                  placeholder="SEARCH TICKER..." 
                  className="flex-1 bg-transparent text-4xl sm:text-6xl md:text-8xl font-black italic uppercase outline-none placeholder:text-zinc-900 text-white tracking-tighter w-full min-w-0" 
                  value={anaInput} 
                  onChange={(e) => setAnaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePathfinder()}
                />
                <button onClick={() => handlePathfinder()} className="btn-primary w-full md:w-auto px-16 h-20 sm:h-24 shadow-2xl shadow-emerald-500/10 font-black italic text-[14px]">Start Audit</button>
              </div>

              {analysis ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-10 animate-in zoom-in-95 pb-32 text-left items-start">
                  <div className="glass-card p-8 sm:p-20 bg-gradient-to-br from-[#0c0c0c] to-black border-white/10 relative overflow-hidden min-w-0 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12 pointer-events-none -z-10"><Sword size={500} /></div>
                    
                    <div className="flex flex-col sm:flex-row gap-12 mb-24 relative z-10 items-start sm:items-center">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8 w-fit shadow-lg">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Quantum Resolved</span>
                        </div>
                        <h2 className="font-black italic uppercase leading-[0.8] tracking-tighter text-white mb-6 break-words hyphens-auto" style={{ fontSize: 'clamp(3rem, 15vw, 8rem)' }}>{analysis.ticker}</h2>
                        <p className="text-xl sm:text-4xl text-zinc-600 font-bold uppercase tracking-[0.2em] break-words leading-tight italic">{analysis.name}</p>
                      </div>

                      <div className="bg-black/60 p-8 sm:p-12 rounded-[4rem] border border-white/5 flex flex-col items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative shrink-0 w-full sm:w-auto">
                        <div className="relative w-44 h-44 sm:w-64 sm:h-64 flex items-center justify-center">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="46" fill="none" stroke="#09090b" strokeWidth="8" />
                              <circle 
                                cx="50" cy="50" r="46" fill="none" stroke="#10b981" strokeWidth="8" 
                                strokeDasharray="289" 
                                strokeDashoffset={289 * (1 - getNormalizedHealth(analysis.health))} 
                                strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                              />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-6xl sm:text-9xl font-black italic tabular-nums leading-none text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                               {Math.round(getNormalizedHealth(analysis.health) * 100)}
                             </span>
                             <span className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.5em] mt-4">Health index</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 mb-24 relative z-10">
                      <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em] ml-2 flex items-center gap-3">
                        <Gauge size={18} className="text-emerald-500 shrink-0" /> Intelligence Matrix
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {analysis.metrics.map((m, i) => (
                          <div key={i} className="flex flex-col p-8 bg-zinc-950 border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all hover:bg-zinc-900 min-w-0 shadow-2xl">
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-4 truncate">{m.label}</span>
                             <div className="flex items-center justify-between gap-4 overflow-hidden">
                               <span className="text-2xl sm:text-3xl font-black text-zinc-100 italic tracking-tighter truncate">{m.value}</span>
                               <div className={`p-2 rounded-full shrink-0 ${m.status === 'positive' ? 'text-emerald-500 bg-emerald-500/10' : m.status === 'negative' ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-600 bg-zinc-600/10'}`}>
                                 <Activity size={18} />
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-10 sm:p-16 bg-black/80 rounded-[4rem] border border-white/10 relative z-10 mb-20 shadow-2xl">
                      <p className="text-2xl sm:text-5xl italic text-zinc-300 font-medium leading-relaxed break-words">"{analysis.desc}"</p>
                    </div>

                    <div className="space-y-12 relative z-10">
                      <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em] ml-2 flex items-center gap-3">
                        <Flame size={18} className="text-orange-500 shrink-0" /> Neural Sentiment Pulse
                      </h3>
                      <div className="flex flex-wrap gap-10 justify-center sm:justify-start">
                        {analysis.sentiment?.map((s, i) => (
                          <RadialSentimentChart key={i} label={s.label} score={s.score} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-10 w-full sticky top-14">
                    <div className="glass-card p-10 sm:p-14 bg-zinc-950/60 space-y-16 shadow-2xl border-white/5">
                       <div className="space-y-8">
                         <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em] ml-2 flex items-center gap-3">
                           <Zap size={18} className="text-blue-500 shrink-0" /> Alpha Catalysts
                         </h3>
                         <div className="space-y-5">
                            {analysis.catalysts.map((cat, i) => (
                              <div key={i} className="flex flex-col p-8 bg-black border border-white/5 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all shadow-xl hover:-translate-y-1 duration-300">
                                 <div className="flex items-center justify-between mb-6">
                                   <div className={`text-[10px] font-black px-4 py-1.5 rounded-full border ${cat.impact === 'high' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>
                                      {cat.impact.toUpperCase()} IMPACT
                                   </div>
                                   <AlertCircle size={20} className="text-zinc-800" />
                                 </div>
                                 <span className="text-lg sm:text-2xl font-bold text-zinc-300 italic group-hover:text-white transition-colors">"{cat.title}"</span>
                              </div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="space-y-8 pt-16 border-t border-white/10">
                          <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em] ml-2">Logic Vectors</h3>
                          <div className="grid grid-cols-1 gap-6">
                             <div className="p-10 bg-black border border-white/5 rounded-[3rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-2xl">
                                <div className="min-w-0"><span className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 truncate">Bull Horizon</span><span className="text-emerald-400 font-black italic text-3xl uppercase tracking-tighter truncate block">{analysis.short}</span></div>
                                <BullIcon size={40} className="text-emerald-950 group-hover:text-emerald-500/20 transition-colors shrink-0" />
                             </div>
                             <div className="p-10 bg-black border border-white/5 rounded-[3rem] flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-2xl">
                                <div className="min-w-0"><span className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 truncate">Stability Matrix</span><span className="text-blue-400 font-black italic text-3xl uppercase tracking-tighter truncate block">{analysis.long}</span></div>
                                <Shield size={40} className="text-blue-950 group-hover:text-blue-500/20 transition-colors shrink-0" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[600px] glass-card opacity-20 border-dashed border-zinc-800 bg-zinc-950/20">
                    <Target size={120} className="mb-10 text-zinc-700" />
                    <p className="text-3xl sm:text-6xl font-black italic tracking-tighter uppercase text-center text-zinc-700">Awaiting Search Sequence</p>
                </div>
              )}
            </div>
          )}

          {/* COMPARATOR TAB */}
          {activeTab === 'comparator' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 w-full pb-32">
              <div className="text-center px-6 mb-24">
                 <h2 className="title-fluid mb-8">DUEL RESOLVER</h2>
                 <p className="text-[11px] sm:text-[14px] font-black text-zinc-600 uppercase tracking-[0.6em] break-words">Advanced Benchmark Duel</p>
                 
                 <div className="mt-16 flex flex-wrap justify-center gap-4">
                    <span className="text-[10px] font-black uppercase text-zinc-800 w-full mb-4 tracking-[0.4em]">Institutional Presets</span>
                    {[
                      { l: "Global Liquidity (DXY vs SPX)", a: "DXY", b: "SPX", icon: Landmark },
                      { l: "Digital Gold (BTC vs ETH)", a: "BTC", b: "ETH", icon: Gem },
                      { l: "Rate Shock (TLT vs QQQ)", a: "TLT", b: "QQQ", icon: Scale },
                      { l: "Energy Duel (Oil vs Solar)", a: "OIL", b: "Solar", icon: Flame },
                    ].map((d, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleComparator(d.a, d.b)}
                        className="px-6 py-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex items-center gap-4 group"
                      >
                        <d.icon size={14} className="group-hover:scale-125 transition-transform" /> {d.l}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-14 items-center relative text-left px-4">
                {loading && <CardLoader label="Executing Logical Resolution Duel..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handleComparator()} onDismiss={() => setApiError(null)} />}
                <div className="glass-card p-10 sm:p-20 bg-blue-500/5 border-blue-500/20 shadow-2xl rounded-[3rem]">
                   <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] block mb-10">ALPHA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-8 text-center text-5xl sm:text-8xl font-black italic uppercase text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-950" placeholder="TICKER A" value={compInputs.s1} onChange={(e) => setCompInputs({ ...compInputs, s1: e.target.value.toUpperCase() })} />
                </div>
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center bg-black border-2 border-zinc-900 rounded-full mx-auto select-none shrink-0 z-10 shadow-[0_0_60px_rgba(0,0,0,1)]">
                  <span className="text-zinc-800 font-black italic text-4xl sm:text-6xl">VS</span>
                </div>
                <div className="glass-card p-10 sm:p-20 bg-rose-500/5 border-rose-500/20 shadow-2xl rounded-[3rem]">
                   <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] block mb-10 text-right">BETA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-8 text-center text-5xl sm:text-8xl font-black italic uppercase text-white outline-none focus:border-rose-500 transition-colors placeholder:text-zinc-950 text-right" placeholder="TICKER B" value={compInputs.s2} onChange={(e) => setCompInputs({ ...compInputs, s2: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className="px-8 mt-16"><button onClick={() => handleComparator()} disabled={loading} className="btn-primary w-full py-8 text-base italic font-black shadow-2xl shadow-emerald-500/20 rounded-[2rem]">Execute Institutional Resolution</button></div>
              
              {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-12 animate-in zoom-in-95 pb-32 text-left items-start px-4 mt-24">
                  <div className="glass-card bg-emerald-950 p-12 sm:p-20 text-zinc-100 flex flex-col justify-center relative overflow-hidden shadow-2xl border-emerald-500/40 rounded-[4rem]">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 -z-10"><Trophy size={250} /></div>
                    <span className="text-[12px] font-black uppercase tracking-[0.6em] mb-12 text-emerald-500 italic">Superiority Vector</span>
                    <h2 className="font-black italic uppercase tracking-tighter mb-16 leading-none break-all" style={{ fontSize: 'clamp(3.5rem, 15vw, 10rem)' }}>{comparison.winner}</h2>
                    <div className="bg-black/90 text-white px-10 py-6 rounded-[3rem] inline-flex items-center gap-6 w-fit shadow-2xl border border-white/10 max-w-full">
                       <Zap size={32} className="text-emerald-500 shrink-0" />
                       <span className="text-base sm:text-2xl font-black italic uppercase tracking-widest break-words">{comparison.decision}</span>
                    </div>
                  </div>
                  
                  <div className="glass-card p-12 sm:p-20 bg-zinc-950/60 border-white/5 min-w-0 shadow-2xl rounded-[4rem]">
                    <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em] mb-16 border-b border-white/5 pb-10">Neural Divergence Matrix</h3>
                    <div className="space-y-16">
                      {comparison.scorecard.map((s, i) => (
                        <div key={i} className="space-y-8 group">
                          <div className="flex justify-between items-end px-2 gap-8">
                            <div className="flex flex-col min-w-0 flex-1"><span className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest truncate">{compInputs.s1 || 'ALPHA'}</span><span className="text-lg sm:text-2xl font-black italic text-zinc-100 truncate">{s.s1Value}</span></div>
                            <span className="text-[11px] sm:text-[14px] font-black text-zinc-700 uppercase tracking-[0.4em] pb-2 text-center shrink-0 w-40 sm:w-64 border-b border-white/5 mb-2">{s.label}</span>
                            <div className="flex flex-col text-right min-w-0 flex-1"><span className="text-[10px] font-black text-rose-500 uppercase mb-3 tracking-widest truncate">{compInputs.s2 || 'BETA'}</span><span className="text-lg sm:text-2xl font-black italic text-zinc-100 truncate">{s.s2Value}</span></div>
                          </div>
                          <div className="h-3 flex bg-zinc-900 rounded-full overflow-hidden relative w-full shadow-inner">
                             <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ width: `${s.s1Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="h-full bg-rose-600 transition-all duration-1000 shadow-[0_0_20px_rgba(225,29,72,0.4)]" style={{ width: `${s.s2Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-black/80 z-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-20 p-10 sm:p-16 bg-black border border-white/5 rounded-[4rem] shadow-2xl">
                      <p className="text-xl sm:text-3xl text-zinc-400 italic leading-relaxed break-words font-medium">"{comparison.summary}"</p>
                    </div>
                    <SourceLink sources={comparison.sources || []} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PULSE TAB */}
          {activeTab === 'pulse' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 w-full pb-32">
               <div className="flex flex-wrap justify-between items-end gap-10 mb-20 text-left px-6">
                  <div className="space-y-5 min-w-[320px]">
                     <h2 className="title-fluid">LOGIC PULSE</h2>
                     <p className="text-[11px] sm:text-[16px] font-black text-zinc-700 uppercase tracking-[0.6em] break-words">Institutional Strategic Feed</p>
                  </div>
                  <button onClick={handleFetchPulse} className="w-20 h-20 glass-card items-center justify-center text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all shrink-0 rounded-[2rem] shadow-2xl"><RefreshCw size={32} className={loading ? 'animate-spin' : ''} /></button>
               </div>
               
               <div className="space-y-8 relative px-6">
                  {loading && <CardLoader label="Syncing Logic Streams..." />}
                  {apiError && <ErrorOverlay message={apiError} onRetry={handleFetchPulse} onDismiss={() => setApiError(null)} />}
                  {pulseItems.map((item, i) => (
                    <div key={i} className="group glass-card flex flex-col sm:flex-row sm:items-center justify-between p-10 sm:p-12 hover:bg-zinc-900/40 transition-all border-l-4 border-l-zinc-900 hover:border-l-emerald-500 cursor-pointer text-left gap-10 overflow-hidden shadow-2xl hover:shadow-emerald-500/10 rounded-[3rem]">
                      <div className="flex items-start sm:items-center gap-10 sm:gap-20 min-w-0">
                        <div className="text-left sm:text-center min-w-[100px] sm:min-w-[140px] shrink-0">
                          <span className="block font-mono text-zinc-700 text-[11px] sm:text-[13px] mb-4 uppercase tracking-widest">{item.time}</span>
                          <div className={`text-[10px] font-black px-4 py-2 rounded-full border inline-block sm:block ${item.impact === 'High' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'}`}>{item.impact.toUpperCase()} IMPACT</div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-zinc-300 group-hover:text-white transition-colors text-2xl sm:text-4xl mb-4 uppercase tracking-tight italic line-clamp-2 leading-tight break-words">{item.title}</h4>
                          <div className="flex items-center gap-6">
                             <div className="badge px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.sector}</div>
                             <div className="w-2 h-2 rounded-full bg-emerald-950 shrink-0" />
                             <span className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.4em] shrink-0">QUANT_INTEL_SYSTEM</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={40} className="hidden sm:block text-zinc-900 group-hover:text-emerald-500 group-hover:translate-x-6 transition-all shrink-0 ml-10" />
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
    <div className="p-10 bg-zinc-950 border border-white/5 rounded-[3rem] flex flex-col items-center group hover:border-white/20 transition-all min-w-[200px] shadow-2xl hover:-translate-y-2">
      <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center mb-10">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#09090b" strokeWidth="12" />
          <circle 
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="12" 
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={28} style={{ color }} className="mb-3" />
          <span className="text-3xl sm:text-4xl font-black italic" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 text-center leading-relaxed italic">{label}</span>
    </div>
  );
};

const SourceLink: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-16 pt-12 border-t border-white/5 text-left">
      <div className="flex items-center gap-4 mb-8">
        <Globe size={18} className="text-zinc-800" />
        <span className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-800">Quant Source Verification</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sources.map((s, i) => (
          <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-[2rem] hover:border-emerald-500/40 hover:bg-zinc-900 transition-all group overflow-hidden shadow-xl">
            <span className="text-[12px] text-zinc-600 group-hover:text-zinc-100 truncate pr-10 font-bold uppercase tracking-tight">{s.title}</span>
            <ExternalLink size={16} className="text-zinc-800 group-hover:text-emerald-500 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
