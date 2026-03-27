import { useState } from 'react';
import { Search, Activity, CheckCircle, FileText, Loader2 } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, complete
  const [activeAgent, setActiveAgent] = useState(null); // 'researcher', 'auditor', 'generator'
  const [report, setReport] = useState('');

  const runResearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setStatus('loading');
    setActiveAgent('researcher');
    setReport('');

    try {
      // Mock tracking the agents for now, later replaced by actual polling/websockets
      setTimeout(() => setActiveAgent('auditor'), 2000);
      setTimeout(() => setActiveAgent('generator'), 4000);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await res.json();
      
      // Wait a bit to show the "generator" animation
      setTimeout(() => {
        setReport(data.report || "No report generated.");
        setStatus('complete');
        setActiveAgent(null);
      }, 5500);
      
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setActiveAgent(null);
    }
  };

  const Step = ({ id, label, icon: Icon }) => {
    const isActive = activeAgent === id;
    const isPast = 
      (id === 'researcher' && (activeAgent === 'auditor' || activeAgent === 'generator' || status === 'complete')) ||
      (id === 'auditor' && (activeAgent === 'generator' || status === 'complete')) ||
      (id === 'generator' && status === 'complete');

    return (
      <div className={`flex flex-col items-center transition-all duration-500 ${isActive ? 'scale-110 opacity-100' : isPast ? 'opacity-70' : 'opacity-40 grayscale'}`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 
          ${isActive ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 
            isPast ? 'bg-cyber-magenta/20 border border-cyber-magenta' : 'bg-slate-800 border border-slate-700'}`}>
          {isActive ? <Loader2 className="w-6 h-6 text-cyber-cyan animate-spin" /> : <Icon className={`w-6 h-6 ${isPast ? 'text-cyber-magenta' : 'text-slate-400'}`} />}
        </div>
        <span className={`text-sm tracking-wide ${isActive ? 'text-cyber-cyan font-semibold neon-text' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-cyber-darker to-black p-4 md:p-8 flex flex-col items-center">
      
      <header className="w-full max-w-4xl flex items-center justify-between mb-12 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-cyan to-cyber-magenta flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-tight">
            Market<span className="text-cyber-cyan">Analyst</span><span className="text-cyber-magenta">.AI</span>
          </h1>
        </div>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        {/* Search Bar */}
        <form onSubmit={runResearch} className="w-full max-w-2xl relative mb-16 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-cyan to-cyber-magenta rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
          <div className="relative flex items-center bg-cyber-dark rounded-xl px-4 py-3 ring-1 ring-white/10 input-glow">
            <Search className="w-5 h-5 text-cyber-cyan mr-3" />
            <input 
              type="text" 
              className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 font-sans text-lg"
              placeholder="Enter market research topic..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={status === 'loading'}
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="ml-4 px-6 py-2 bg-gradient-to-r from-cyber-cyan/80 to-cyber-magenta/80 hover:from-cyber-cyan hover:to-cyber-magenta text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
        </form>

        {/* Workflow Visualizer */}
        {(status === 'loading' || status === 'complete') && (
          <div className="w-full max-w-2xl glass-panel rounded-2xl p-8 mb-12">
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-mono mb-8 text-center">Agent Execution Pipeline</h3>
            <div className="flex justify-between items-center relative px-4">
              {/* Connecting Line */}
              <div className="absolute left-10 right-10 top-7 h-[2px] bg-slate-800 -z-10">
                <div className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-magenta transition-all duration-1000" 
                  style={{ width: status === 'complete' ? '100%' : activeAgent === 'generator' ? '100%' : activeAgent === 'auditor' ? '50%' : '0%' }}>
                </div>
              </div>

              <Step id="researcher" label="RESEARCHER" icon={Search} />
              <Step id="auditor" label="AUDITOR" icon={CheckCircle} />
              <Step id="generator" label="GENERATOR" icon={FileText} />
            </div>
          </div>
        )}

        {/* Report Output */}
        {status === 'complete' && report && (
          <div className="w-full glass-panel rounded-2xl p-8 neon-border animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
              <FileText className="w-5 h-5 text-cyber-magenta" />
              <h2 className="text-xl font-mono text-slate-100">Final Report</h2>
            </div>
            <div className="prose prose-invert prose-cyan max-w-none text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
              {report}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
