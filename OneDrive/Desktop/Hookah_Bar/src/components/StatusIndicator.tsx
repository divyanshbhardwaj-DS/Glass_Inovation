import React from 'react';
import type { InteractionState } from '../types';
import { Camera, Hand, Smile } from 'lucide-react';

interface StatusIndicatorProps {
  state: InteractionState;
  isCameraActive: boolean;
  isHandDetected: boolean;
  isFaceDetected: boolean;
  isSimulationMode: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  isCameraActive,
  isHandDetected,
  isFaceDetected,
  isSimulationMode,
}) => {
  const formatStateName = (st: InteractionState): string => {
    switch (st) {
      case 'READY_TO_GRAB': return 'Ready to Grab';
      case 'PIPE_GRABBED': return 'Pipe Grabbed';
      case 'MOVING_TO_MOUTH': return 'Moving to Mouth';
      case 'PIPE_NEAR_MOUTH': return 'Mouth Aligned';
      case 'INHALING': return 'Inhaling draw';
      case 'INHALED': return 'Inhaled';
      case 'EXHALE_READY': return 'Blow Ready';
      case 'SMOKE_ACTIVE': return 'Smoke Plume Active';
      case 'SMOKE_COOLDOWN': return 'Cooldown';
      default: return st.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <div className="absolute top-6 left-6 z-30 flex items-center gap-2 pointer-events-none">
      <div className="glass-panel-subtle px-3 py-1.5 rounded-full flex items-center gap-2 text-xs border border-white/10">
        {/* Camera Pill */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          <Camera className={`w-3.5 h-3.5 ${isCameraActive ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="text-[11px] text-slate-300">
            {isSimulationMode ? 'Sim Mode' : isCameraActive ? 'Webcam Live' : 'Camera Off'}
          </span>
        </div>

        {/* Hand Pill */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          <Hand className={`w-3.5 h-3.5 ${isHandDetected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className={`text-[11px] ${isHandDetected ? 'text-emerald-300' : 'text-slate-500'}`}>
            Hand
          </span>
        </div>

        {/* Face Pill */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          <Smile className={`w-3.5 h-3.5 ${isFaceDetected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className={`text-[11px] ${isFaceDetected ? 'text-emerald-300' : 'text-slate-500'}`}>
            Face
          </span>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-1 pl-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-medium text-amber-300 capitalize">
            {formatStateName(state)}
          </span>
        </div>
      </div>
    </div>
  );
};
