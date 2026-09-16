import React from 'react';
import { Sparkles, Shield, Camera, Wind, Hand, Play, Flame } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  onSimulate: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onSimulate }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between px-6 py-10 bg-[#05070c] overflow-y-auto">
      {/* Ambient background glow & atmospheric wisps */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-500/10 via-rose-500/5 to-cyan-500/10 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Header / Brand */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-widest uppercase text-amber-400 font-sans">
              Shisha Lounge AR
            </span>
            <h2 className="text-xs text-slate-400 font-normal">Next-Gen Web Experience</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Client-Side Private</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center my-auto py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Computer Vision & AR Lounge</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-tight mb-6">
          VIRTUAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">HOOKAH</span> BAR
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-10 font-normal">
          Experience an interactive shisha lounge right inside your browser. Grab the virtual pipe with your real hand, bring it to your lips to draw an inhale with bubbling water, and exhale thick, organic smoke plumes using facial gesture recognition.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-white font-semibold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 flex items-center justify-center gap-3 group active:scale-98"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>ENTER VIRTUAL LOUNGE</span>
          </button>

          <button
            onClick={onSimulate}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm border border-white/10 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>Try Simulation Mode (No Camera)</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-16 text-left">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <Hand className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Hand Tracking</h3>
            <p className="text-xs text-slate-400 leading-normal">
              MediaPipe AI tracks your real hand so you can grab the virtual pipe and move it naturally.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Blow Detection</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Lip geometry and blendshapes detect when you blow, triggering physics-driven smoke clouds.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-all">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Sensory Audio</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Procedural Web Audio synthesizes bubbling water, ember sizzle, and gentle lounge soundscapes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/5 gap-3">
        <span>Virtual Hookah Bar • Interactive Portfolio Experience</span>
        <div className="flex items-center gap-4">
          <span>Camera stream is processed 100% locally</span>
          <span>•</span>
          <span>Zero cloud transmission</span>
        </div>
      </footer>
    </div>
  );
};
