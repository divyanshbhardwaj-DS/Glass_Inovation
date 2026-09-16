import React, { useState } from 'react';
import { HOOKAH_PRESETS } from '../config/hookahs';
import type { HookahConfig } from '../types';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { HookahModel } from './HookahModel';

interface HookahSelectionProps {
  selectedHookah: HookahConfig;
  onSelect: (hookah: HookahConfig) => void;
  onProceed: () => void;
  onBack?: () => void;
}

export const HookahSelection: React.FC<HookahSelectionProps> = ({
  selectedHookah,
  onSelect,
  onProceed,
  onBack,
}) => {
  const [active, setActive] = useState<HookahConfig>(selectedHookah);

  const handleCardClick = (hookah: HookahConfig) => {
    setActive(hookah);
    onSelect(hookah);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between px-6 py-10 bg-[#05070c] overflow-y-auto">
      {/* Background radial atmosphere */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full filter blur-[140px] pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${active.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-all"
          >
            ← Back to Home
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Lounge Collection</span>
        </div>
      </div>

      {/* Content Container */}
      <main className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center my-auto py-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
          CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">HOOKAH</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-10">
          Select from handcrafted traditional shishas to futuristic cyber pieces, each tailored with distinct aesthetics, smoke tones, and flavor profiles.
        </p>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-10">
          {HOOKAH_PRESETS.map((hookah) => {
            const isSelected = active.id === hookah.id;

            return (
              <div
                key={hookah.id}
                onClick={() => handleCardClick(hookah)}
                className={`group relative rounded-3xl p-5 cursor-pointer text-left transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'glass-panel ring-2 ring-amber-400/80 bg-white/[0.08] shadow-2xl scale-[1.02]'
                    : 'glass-panel hover:bg-white/[0.04] hover:border-white/20'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${hookah.accentColor}20`,
                      color: hookah.accentColor,
                    }}
                  >
                    {hookah.badge}
                  </span>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full h-44 flex items-center justify-center my-2 group-hover:scale-105 transition-transform duration-300">
                  <HookahModel config={hookah} isBubbling={isSelected} isInhaling={false} />
                </div>

                {/* Card Info */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {hookah.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {hookah.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-xl">
                    <span className="text-amber-400">Flavor:</span>
                    <span className="truncate font-medium">{hookah.flavor}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proceed CTA */}
        <button
          onClick={onProceed}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center gap-3 active:scale-98"
        >
          <span>PROCEED WITH {active.name.toUpperCase()}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-xs text-slate-500">
        Click any hookah card to inspect details and prepare your session
      </footer>
    </div>
  );
};
