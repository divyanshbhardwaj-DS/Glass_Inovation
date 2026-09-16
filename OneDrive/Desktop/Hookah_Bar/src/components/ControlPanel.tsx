import React from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Eye,
  EyeOff,
  MousePointer,
  LogOut,
} from 'lucide-react';
import type { HookahConfig } from '../types';

interface ControlPanelProps {
  currentHookah: HookahConfig;
  isMuted: boolean;
  isFullscreen: boolean;
  isDebugVisible: boolean;
  isSimulationMode: boolean;
  onChangeHookah: () => void;
  onReset: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleDebug: () => void;
  onToggleSimulation: () => void;
  onExit: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentHookah,
  isMuted,
  isFullscreen,
  isDebugVisible,
  isSimulationMode,
  onChangeHookah,
  onReset,
  onToggleMute,
  onToggleFullscreen,
  onToggleDebug,
  onToggleSimulation,
  onExit,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      <div className="glass-panel px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-2xl border border-white/10 backdrop-blur-xl">
        {/* Change Hookah Button */}
        <button
          onClick={onChangeHookah}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all border border-white/5 hover:border-white/20 active:scale-95"
          title="Switch Hookah Model"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{currentHookah.name}</span>
          <span className="sm:hidden">Hookah</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Reset Experience [R] */}
        <button
          onClick={onReset}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
          title="Reset Interaction [R]"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Mute Audio [M] */}
        <button
          onClick={onToggleMute}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
          title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Debug Overlay [D] */}
        <button
          onClick={onToggleDebug}
          className={`p-2 rounded-xl transition-all border border-white/5 active:scale-95 ${
            isDebugVisible
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
          }`}
          title="Toggle CV Debug Landmarks [D]"
        >
          {isDebugVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Simulation Mode [S] */}
        <button
          onClick={onToggleSimulation}
          className={`p-2 rounded-xl transition-all border border-white/5 active:scale-95 ${
            isSimulationMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
          }`}
          title="Toggle Mouse / Touch Simulation [S]"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Fullscreen [F] */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/5 active:scale-95"
          title="Toggle Fullscreen [F]"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Exit to Lounge Home */}
        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-all border border-rose-500/20 active:scale-95"
          title="Exit Experience [ESC]"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
