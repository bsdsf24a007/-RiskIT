import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Scale, Target, Radio, Menu, X, ArrowRight,
  Layers, RefreshCw, Trophy, Search, Network, TrendingUp,
  ShieldCheck, Clock, Globe, BarChart3, Activity, ExternalLink, Info,
  TrendingDown, Zap, Shield, Flame, ChevronRight, AlertCircle, CheckCircle2,
  Gauge, TrendingUp as BullIcon, TrendingDown as BearIcon, OctagonAlert
} from 'lucide-react';
import { 
  TabType, RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource 
} from './types';
import { 
  getArchitectStrategy, getComparison, getAnalysis, getLogicPulse 
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
  ];

  return (
    <div className="h-10 bg-black/80 backdrop-blur-md border-b border-white/5 overflow-hidden flex items-center group sticky top-0 z-50">
      <div className="flex animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-8 border-r border-white/5 h-10">
            <span className="text-[10px] font-black italic text-zinc-500 tracking-tighter uppercase">{item.s}</span>
            <span className="text-[10px] font-mono text-zinc-200">{item.p}</span>
            <span className={`text-[9px] font-bold ${item.u ? 'text-emerald-500' : 'text-rose-500'}`}>
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
    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs leading-relaxed">Cross-referencing global indices via real-time search grounding protocol...</span>
  </div>
);

const ErrorOverlay: React.FC<{ message: string; onRetry: () => void; onDismiss: () => void }> = ({ message, onRetry, onDismiss }) => {
  const isQuota = message.includes('429');
  const isKeyError = message.includes('403') || message.includes('400') || message.includes('API_KEY_INVALID') || message.includes('BUILD_ERROR');
  
  return (
    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl z-[70] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
      <div className="w-20 h-20 mb-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
        <OctagonAlert className="text-rose-500 animate-pulse" size={40} />
      </div>
      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-4">Logic Pipeline Exhausted</h3>
      <p className="text-zinc-500 text-sm max-w-md mb-6 font-medium leading-relaxed uppercase tracking-wider">
        {isQuota 
          ? "Your Gemini API key has exceeded its current quota. Please wait a few minutes or upgrade your plan." 
          : isKeyError
          ? "CRITICAL: API Identity Mismatch. You MUST update 'API_KEY' in Vercel and TRIGGER A NEW DEPLOYMENT (Redeploy) for changes to take effect."
          : `An unexpected disruption occurred: ${message.slice(0, 100)}...`}
      </p>
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-10 overflow-hidden max-w-md">
        <p className="text-[9px] font-mono text-emerald-500 mb-1 font-bold uppercase tracking-widest">Action Required:</p>
        <p className="text-[10px] font-mono text-zinc-400 break-words uppercase">Vercel -> Project -> Settings -> Environment Variables -> Edit 'API_KEY' -> Save -> Go to Deployments -> Redeploy</p>
      </div>
      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={onRetry} className="flex-1 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all">Retry Link</button>
        <button onClick={onDismiss} className="flex-1 py-4 border border-zinc-800 text-zinc-500 font-black uppercase text-[11px] tracking-widest rounded-xl hover:border-zinc-400 transition-all">Dismiss</button>
      </div>
    </div>
  );
};

const NodeRow: React.FC<{ ticker: string; name: string; trend: number[]; onClick?: () => void }> = ({ ticker, name, trend, onClick }) => {
  const hasVariance = trend.some(v => v !== trend[0]);
  const processedTrend = hasVariance 
    ? trend 
    : trend.map((v, i) => v + (i % 2 === 0 ? 3 : -3));

  const min = Math.min(...processedTrend);
  const max = Math.max(...processedTrend);
  const range = (max - min) || 10;
  const padding = range * 0.2;
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
      className="group flex items-center justify-between p-4 sm:p-5 bg-zinc-950/40 border border-white/5 rounded-2xl hover:border-emerald-500/40 hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black border border-white/5 flex items-center justify-center font-black italic text-zinc-700 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all text-xs">
          {ticker[0]}
        </div>
        <div className="min-w-0">
          <h4 className="font-black italic text-base sm:text-lg text-zinc-200 group-hover:text-white transition-colors truncate uppercase tracking-tight leading-none mb-1">{ticker}</h4>
          <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-widest truncate">{name}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="w-20 h-10 sm:w-28 sm:h-12 flex items-center">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <path 
              d={`M ${points}`} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500"
            />
          </svg>
        </div>
        <ChevronRight size={18} className="text-zinc-800 group-hover:text-emerald-500 transition-all" />
      </div>
    </div>
  );
};

const SourceLink: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div className="mt-8 pt-6 border-t border-white/5 text-left">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Audit Intelligence Path</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sources.map((s, i) => (
          <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl hover:border-emerald-500/20 hover:bg-zinc-900 transition-all group">
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-200 truncate pr-4">{s.title}</span>
            <ExternalLink size={10} className="text-zinc-700 group-hover:text-emerald-500 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};

const RadialSentimentChart: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const isBullish = label.toLowerCase().includes('bull');
  const color = isBullish ? '#10b981' : '#f43f5e';
  const Icon = isBullish ? BullIcon : BearIcon;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl flex flex-col items-center group hover:border-white/10 transition-all">
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" stroke="#161616" strokeWidth="8" 
          />
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" stroke={color} strokeWidth="8" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={24} style={{ color }} className="mb-1" />
          <span className="text-2xl font-black italic" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{label} Logic</span>
    </div>
  );
};

// --- Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('architect');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Inputs
  const [recInputs, setRecInputs] = useState({ amount: '50000', market: 'S&P 500', horizon: 'Medium Term', halal: true });
  const [compInputs, setCompInputs] = useState({ s1: '', s2: '' });
  const [anaInput, setAnaInput] = useState('');

  // Results
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [pulseItems, setPulseItems] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'pulse' && pulseItems.length === 0) handleFetchPulse();
  }, [activeTab]);

  const handleError = (e: any) => {
    // Log full error for developer debugging in console
    console.error("FULL API ERROR OBJECT:", e);
    const errorMsg = e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
    setApiError(errorMsg);
    setLoading(false);
  };

  const handleFetchPulse = async () => {
    setLoading(true);
    setApiError(null);
    try { setPulseItems(await getLogicPulse()); } catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleArchitect = async () => {
    setLoading(true);
    setApiError(null);
    try { 
      const res = await getArchitectStrategy(recInputs.amount, recInputs.market, recInputs.horizon, recInputs.halal);
      setRecommendations(res);
    } catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleComparator = async () => {
    if (!compInputs.s1 || !compInputs.s2) return;
    setLoading(true);
    setApiError(null);
    try { 
      const res = await getComparison(compInputs.s1, compInputs.s2, recInputs.market, recInputs.halal);
      setComparison(res);
    } catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handlePathfinder = async (tickerOverride?: string) => {
    const ticker = tickerOverride || anaInput;
    if (!ticker) return;
    setLoading(true);
    setApiError(null);
    try {
      const result = await getAnalysis(ticker, recInputs.market, recInputs.horizon, recInputs.halal);
      setAnalysis(result);
      if (tickerOverride) setAnaInput(tickerOverride);
    } catch (e) { handleError(e); } finally { setLoading(false); }
  };

  const handleMarketInputChange = (val: string) => {
    let market = val;
    if (val.toLowerCase() === 'pakistan' || val.toLowerCase() === 'pak') {
      market = 'Pakistan Stock Exchange';
    }
    setRecInputs({ ...recInputs, market });
  };

  const getNormalizedHealth = (h: number) => h > 1 ? h / 100 : h;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-emerald-500/20">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-[#050505] border-r border-white/5 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center gap-4 mb-14 group cursor-pointer">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-black font-black italic shadow-[0_0_20px_rgba(16,185,129,0.3)]">!</div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">RiskIT</h1>
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
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all group relative overflow-hidden ${activeTab === tab.id ? 'bg-zinc-900/60 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20'}`}
              >
                {activeTab === tab.id && <div className="absolute left-0 h-6 w-1 bg-emerald-500 rounded-full" />}
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-500' : 'group-hover:text-zinc-300'} />
                <span className="font-bold uppercase text-[10px] tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-5 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Logic Stream</span>
              <Activity size={12} className="text-emerald-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
              <span className="text-[10px] font-black text-zinc-400 uppercase italic">Nodes Optimized</span>
            </div>
          </div>
        </div>
        
        <div className="p-8 border-t border-white/5 bg-zinc-950/20">
          <div className="mb-8 opacity-40 hover:opacity-100 transition-opacity group/team">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3 text-left">Architect Team</p>
            <div className="space-y-2 font-mono text-[10px] text-zinc-500 text-left">
              <div className="flex items-center gap-2 group-hover/team:text-zinc-300 transition-colors">
                <div className="w-1 h-1 bg-emerald-500/50 rounded-full" /> Abdullah Rashid
              </div>
              <div className="flex items-center gap-2 group-hover/team:text-zinc-300 transition-colors">
                <div className="w-1 h-1 bg-emerald-500/50 rounded-full" /> Moawiz
              </div>
              <div className="flex items-center gap-2 group-hover/team:text-zinc-300 transition-colors">
                <div className="w-1 h-1 bg-emerald-500/50 rounded-full" /> Muhammad Abdullah
              </div>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 text-left">Network Status</p>
          <div className="flex items-center gap-3 text-emerald-500/80 font-mono text-[10px]">
            <ShieldCheck size={14} className="animate-pulse" />
            <span>FLASH_SYNC: ACTIVE</span>
          </div>
        </div>
        <button className="absolute top-8 right-8 text-zinc-600 lg:hidden" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020202]">
        <TickerTape />
        
        <header className="lg:hidden h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/90 backdrop-blur-md z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-2"><Menu size={24} /></button>
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-500 italic">{activeTab}</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 lg:p-14 space-y-12">
          
          {/* ARCHITECT TAB */}
          {activeTab === 'architect' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-6">
              <div className="glass-card p-8 md:p-10 relative h-fit">
                {loading && <CardLoader label="Synthesizing Node Set..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleArchitect} onDismiss={() => setApiError(null)} />}
                <h2 className="title-fluid leading-none mb-10 text-left">ARCHITECT</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
                  <div className="space-y-2 text-left"><label className="field-label ml-1">Capital Pool (USD)</label><input type="number" className="field-input" value={recInputs.amount} onChange={(e) => setRecInputs({ ...recInputs, amount: e.target.value })} /></div>
                  <div className="space-y-2 text-left"><label className="field-label ml-1">Market Search</label><input type="text" className="field-input" placeholder="e.g. Pakistan, Germany, US Tech" value={recInputs.market} onChange={(e) => handleMarketInputChange(e.target.value)} /></div>
                  <div className="space-y-2 text-left"><label className="field-label ml-1">Time Horizon</label><select className="field-input" value={recInputs.horizon} onChange={(e) => setRecInputs({ ...recInputs, horizon: e.target.value })}><option>Short Term</option><option>Medium Term</option><option>Long Term</option></select></div>
                  <div className="flex flex-col justify-center gap-1 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl cursor-pointer group transition-all text-left" onClick={() => setRecInputs({ ...recInputs, halal: !recInputs.halal })}>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ethical Logic</label>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${recInputs.halal ? 'text-emerald-500' : 'text-zinc-700'}`}>Sharia Filter</span>
                      <ShieldCheck size={16} className={recInputs.halal ? 'text-emerald-500' : 'text-zinc-800'} />
                    </div>
                  </div>
                </div>
                <button onClick={handleArchitect} disabled={loading} className="btn-primary w-full group">
                  <span>Generate Blueprint</span>
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              <div className="glass-card p-8 md:p-10 bg-zinc-950/30 border-emerald-500/5 min-h-[500px]">
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Synthesized Result</span>
                  </div>
                  <RefreshCw size={14} className={`text-zinc-800 ${loading ? 'animate-spin' : ''}`} />
                </div>
                {recommendations ? (
                  <div className="space-y-10 animate-in fade-in text-left">
                    <p className="text-xl md:text-2xl text-zinc-100 font-medium italic leading-relaxed pl-6 border-l-2 border-emerald-500/30">"{recommendations.strategy}"</p>
                    <div className="space-y-3">
                      {recommendations.nodes.map((node, i) => (
                        <NodeRow key={i} {...node} onClick={() => { setActiveTab('pathfinder'); handlePathfinder(node.ticker); }} />
                      ))}
                    </div>
                    <SourceLink sources={recommendations.sources || []} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] opacity-10">
                    <BarChart3 size={80} className="mb-6" />
                    <p className="title-fluid text-center">Awaiting Command</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PATHFINDER TAB */}
          {activeTab === 'pathfinder' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
              <div className="glass-card flex flex-col md:flex-row items-center gap-6 p-8 bg-zinc-950 border-emerald-500/10 relative group overflow-hidden">
                {loading && <CardLoader label="Executing Deep Scan..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={() => handlePathfinder()} onDismiss={() => setApiError(null)} />}
                <Search className="text-zinc-800 group-hover:text-emerald-500/50 transition-colors shrink-0" size={40} />
                <input 
                  placeholder="SEARCH TICKER OR COUNTRY..." 
                  className="flex-1 bg-transparent text-3xl md:text-6xl font-black italic uppercase outline-none placeholder:text-zinc-900 text-white tracking-tighter" 
                  value={anaInput} 
                  onChange={(e) => setAnaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePathfinder()}
                />
                <button onClick={() => handlePathfinder()} className="btn-primary w-full md:w-auto px-12 h-16 shadow-xl shadow-emerald-500/10 font-black italic">Start Audit</button>
              </div>

              {analysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 animate-in zoom-in-95 pb-20 text-left">
                  <div className="glass-card p-8 md:p-14 bg-gradient-to-br from-[#0c0c0c] to-black border-white/5 relative overflow-hidden min-w-0">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none"><Zap size={400} /></div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-8 mb-16 relative z-10">
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6 w-fit">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Logic Stream: Active</span>
                        </div>
                        <h2 className="font-black italic uppercase leading-[0.85] tracking-tighter text-white mb-4 break-words" style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}>{analysis.ticker}</h2>
                        <p className="text-xl md:text-3xl text-zinc-500 font-bold uppercase tracking-[0.2em] break-words leading-tight">{analysis.name}</p>
                      </div>

                      <div className="bg-black/60 p-8 md:p-10 rounded-[3rem] border border-white/5 flex flex-col items-center gap-4 shadow-2xl relative min-w-[240px] h-fit shrink-0">
                        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#09090b" strokeWidth="8" />
                              <circle 
                                cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8" 
                                strokeDasharray="264" 
                                strokeDashoffset={264 * (1 - getNormalizedHealth(analysis.health))} 
                                strokeLinecap="round" className="transition-all duration-1000 ease-out" 
                              />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-5xl md:text-7xl font-black italic tabular-nums leading-none text-emerald-500">
                               {Math.round(getNormalizedHealth(analysis.health) * 100)}
                             </span>
                             <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Health index</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mb-16 relative z-10 text-left">
                      <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-1 flex items-center gap-2">
                        <Gauge size={14} className="text-emerald-500" /> Financial Metrics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {analysis.metrics.map((m, i) => (
                          <div key={i} className="flex flex-col p-6 bg-zinc-950/60 border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all hover:bg-zinc-900/40 min-w-0">
                             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2 truncate">{m.label}</span>
                             <div className="flex items-center justify-between gap-2 overflow-hidden">
                               <span className="text-xl md:text-2xl font-black text-zinc-200 italic tracking-tighter truncate">{m.value}</span>
                               <div className={`p-1 rounded-full shrink-0 ${m.status === 'positive' ? 'text-emerald-500 bg-emerald-500/10' : m.status === 'negative' ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-600 bg-zinc-600/10'}`}>
                                 <Activity size={12} />
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-10 bg-black/80 rounded-[2.5rem] border border-white/5 relative z-10 mb-16 text-left">
                      <div className="absolute -top-5 -left-5 w-12 h-12 bg-zinc-900 flex items-center justify-center border border-white/10 rounded-2xl"><Network size={20} className="text-blue-500" /></div>
                      <p className="text-2xl md:text-4xl italic text-zinc-300 font-medium leading-relaxed">"{analysis.desc}"</p>
                    </div>

                    <div className="space-y-6 relative z-10 text-left">
                      <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-1 flex items-center gap-2">
                        <Flame size={14} className="text-orange-500" /> Market Sentiment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {analysis.sentiment?.map((s, i) => (
                          <RadialSentimentChart key={i} label={s.label} score={s.score} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-8 text-left">
                    <div className="glass-card p-10 bg-zinc-950/40 space-y-12 h-full">
                       <div className="space-y-6">
                         <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-1 flex items-center gap-2">
                           <Zap size={14} className="text-blue-500" /> Market Catalysts
                         </h3>
                         <div className="space-y-4">
                            {analysis.catalysts.map((cat, i) => (
                              <div key={i} className="flex flex-col p-6 bg-black border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/5">
                                 <div className="flex items-center justify-between mb-3">
                                   <div className={`badge ${cat.impact === 'high' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : cat.impact === 'medium' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5'} px-3 py-1 rounded-full text-[8px]`}>
                                      {cat.impact} IMPACT
                                   </div>
                                   <AlertCircle size={14} className="text-zinc-800 group-hover:text-zinc-400 transition-colors" />
                                 </div>
                                 <span className="text-base font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight italic">"{cat.title}"</span>
                              </div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="space-y-4 pt-10 border-t border-white/5">
                          <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-1">Logic Projections</h3>
                          <div className="grid grid-cols-1 gap-3">
                             <div className="p-8 bg-black/60 border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                <div><span className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Short Term Path</span><span className="text-emerald-400 font-black italic text-2xl uppercase tracking-tighter truncate">{analysis.short}</span></div>
                                <BullIcon size={28} className="text-emerald-950 group-hover:text-emerald-500/20 transition-colors" />
                             </div>
                             <div className="p-8 bg-black/60 border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                <div><span className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Long Term Stability</span><span className="text-blue-400 font-black italic text-2xl uppercase tracking-tighter truncate">{analysis.long}</span></div>
                                <Shield size={28} className="text-blue-950 group-hover:text-blue-500/20 transition-colors" />
                             </div>
                          </div>
                       </div>
                       <SourceLink sources={analysis.sources || []} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 pb-20 opacity-40">
                  <div className="h-[500px] glass-card flex flex-col items-center justify-center opacity-10 border-dashed border-zinc-800">
                    <Target size={100} className="mb-6" />
                    <p className="title-fluid text-center">WAITING</p>
                  </div>
                  <div className="glass-card p-10 bg-zinc-950/20 border-white/5 flex flex-col gap-8 text-left">
                    <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] ml-1 flex items-center gap-2">
                       <Zap size={14} className="text-blue-500" /> Market Catalysts Preview
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: "Federal Reserve Interest Rate Decision", impact: "high" },
                        { title: "Quarterly Earnings Expansion Protocol", impact: "medium" },
                        { title: "Geopolitical Supply Chain Realignment", impact: "high" }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col p-6 bg-black/50 border border-white/5 rounded-3xl">
                           <div className="flex items-center justify-between mb-3">
                             <div className="badge text-zinc-500 border-zinc-500/20 bg-zinc-500/5 px-3 py-1 rounded-full text-[8px]">
                                {item.impact.toUpperCase()} IMPACT
                             </div>
                             <AlertCircle size={14} className="text-zinc-800" />
                           </div>
                           <span className="text-base font-bold text-zinc-500 italic leading-tight">"{item.title}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPARATOR TAB */}
          {activeTab === 'comparator' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
              <div className="text-center">
                 <h2 className="title-fluid mb-4">DUEL DUO</h2>
                 <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Binary Comparative Analytics Resolution</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center relative text-left">
                {loading && <CardLoader label="Executing Logical Resolution..." />}
                {apiError && <ErrorOverlay message={apiError} onRetry={handleComparator} onDismiss={() => setApiError(null)} />}
                <div className="glass-card p-8 md:p-12 bg-blue-500/5 border-blue-500/20">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-6">ALPHA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-6 text-center text-3xl md:text-6xl font-black italic uppercase text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-900" placeholder="TICKER A" value={compInputs.s1} onChange={(e) => setCompInputs({ ...compInputs, s1: e.target.value.toUpperCase() })} />
                </div>
                <div className="text-zinc-800 font-black italic text-4xl px-8 py-4 border-2 border-zinc-900 rounded-full hidden md:block select-none shrink-0">VS</div>
                <div className="glass-card p-8 md:p-12 bg-rose-500/5 border-rose-500/20">
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-6 text-right">BETA_NODE</span>
                   <input className="w-full bg-transparent border-b border-zinc-800 py-6 text-center text-3xl md:text-6xl font-black italic uppercase text-white outline-none focus:border-rose-500 transition-colors placeholder:text-zinc-900" placeholder="TICKER B" value={compInputs.s2} onChange={(e) => setCompInputs({ ...compInputs, s2: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <button onClick={handleComparator} disabled={loading} className="btn-primary w-full py-6 text-sm italic font-black">Initialize Comparison Duel</button>
              
              {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8 animate-in zoom-in-95 pb-20 text-left">
                  <div className="glass-card bg-emerald-950 p-8 md:p-12 text-zinc-100 flex flex-col justify-center relative overflow-hidden shadow-2xl shadow-emerald-500/20 border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Trophy size={160} /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-emerald-500">Winner Audited</span>
                    <h2 className="font-black italic uppercase tracking-tighter mb-10 leading-none break-words" style={{ fontSize: 'clamp(3rem, 12vw, 9rem)' }}>{comparison.winner}</h2>
                    <div className="bg-black text-white px-6 py-4 rounded-3xl inline-flex items-center gap-4 w-fit shadow-2xl border border-white/10 max-w-full">
                       <Zap size={20} className="text-emerald-500 shrink-0" />
                       <span className="text-sm md:text-base font-black italic uppercase tracking-widest break-words">{comparison.decision}</span>
                    </div>
                  </div>
                  
                  <div className="glass-card p-12 bg-zinc-950/60 border-emerald-500/10 min-w-0 text-left">
                    <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-12 border-b border-white/5 pb-4">Metric Divergence</h3>
                    <div className="space-y-10">
                      {comparison.scorecard.map((s, i) => (
                        <div key={i} className="space-y-4 group">
                          <div className="flex justify-between items-end px-1 gap-4">
                            <div className="flex flex-col min-w-0"><span className="text-[9px] font-black text-blue-500 uppercase mb-1 truncate">{compInputs.s1}</span><span className="text-sm font-black italic text-zinc-100 truncate">{s.s1Value}</span></div>
                            <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest pb-1 text-center shrink-0">{s.label}</span>
                            <div className="flex flex-col text-right min-w-0"><span className="text-[9px] font-black text-rose-500 uppercase mb-1 truncate">{compInputs.s2}</span><span className="text-sm font-black italic text-zinc-100 truncate">{s.s2Value}</span></div>
                          </div>
                          <div className="h-1.5 flex bg-zinc-900/50 rounded-full overflow-hidden relative">
                             <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${s.s1Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="h-full bg-rose-600 transition-all duration-1000" style={{ width: `${s.s2Percent / (s.s1Percent + s.s2Percent) * 100}%` }} />
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-black/50 z-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-14 p-8 bg-black/80 rounded-[2.5rem] border border-white/5 text-lg text-zinc-300 italic leading-relaxed">"{comparison.summary}"</p>
                    <SourceLink sources={comparison.sources || []} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PULSE TAB */}
          {activeTab === 'pulse' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
               <div className="flex justify-between items-end mb-12 text-left">
                  <div className="space-y-4">
                     <h2 className="title-fluid">LOGIC PULSE</h2>
                     <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Global Node Shift Stream</p>
                  </div>
                  <button onClick={handleFetchPulse} className="w-16 h-16 glass-card items-center justify-center text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
               </div>
               
               <div className="space-y-4 relative">
                  {loading && <CardLoader label="Updating Logic Streams..." />}
                  {apiError && <ErrorOverlay message={apiError} onRetry={handleFetchPulse} onDismiss={() => setApiError(null)} />}
                  {pulseItems.map((item, i) => (
                    <div key={i} className="group glass-card flex-row items-center justify-between p-8 hover:bg-zinc-900/40 transition-all border-l-4 border-l-zinc-900 hover:border-l-emerald-500 cursor-pointer text-left">
                      <div className="flex items-center gap-10 min-w-0">
                        <div className="text-center min-w-[100px] shrink-0">
                          <span className="block font-mono text-zinc-600 text-[10px] mb-2">{item.time}</span>
                          <div className={`text-[9px] font-black px-3 py-1 rounded border ${item.impact === 'High' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'}`}>{item.impact} IMPACT</div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-zinc-200 group-hover:text-white transition-colors text-xl md:text-2xl truncate mb-2 uppercase tracking-tight italic">{item.title}</h4>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.sector}</span>
                             <div className="w-1 h-1 rounded-full bg-zinc-800" />
                             <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">G_INTEL_STREAM</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={24} className="text-zinc-900 group-hover:text-emerald-500 group-hover:translate-x-3 transition-all shrink-0 ml-4" />
                    </div>
                  ))}
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}