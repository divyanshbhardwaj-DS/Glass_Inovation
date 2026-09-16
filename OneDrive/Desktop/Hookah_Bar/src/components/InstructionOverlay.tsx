import React from 'react';
import type { InteractionState } from '../types';
import { Sparkles, Hand, Flame, Wind, CheckCircle2 } from 'lucide-react';

interface InstructionOverlayProps {
  state: InteractionState;
  isHandDetected: boolean;
  isFaceDetected: boolean;
}

export const InstructionOverlay: React.FC<InstructionOverlayProps> = ({
  state,
  isHandDetected,
  isFaceDetected,
}) => {
  const getInstruction = () => {
    switch (state) {
      case 'TRACKING_INITIALIZING':
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />,
          title: 'Initializing Computer Vision...',
          sub: 'Loading MediaPipe neural models',
        };

      case 'HAND_SEARCH':
        return {
          icon: <Hand className="w-5 h-5 text-amber-400 animate-bounce" />,
          title: 'Show your hand to the camera',
          sub: 'Position your hand in front of your webcam',
        };

      case 'READY_TO_GRAB':
        return {
          icon: <Hand className="w-5 h-5 text-amber-400" />,
          title: 'Grab the Hookah Pipe',
          sub: 'Move your hand over the glowing pipe handle',
        };

      case 'PIPE_GRABBED':
        return {
          icon: <Flame className="w-5 h-5 text-emerald-400" />,
          title: 'Pipe Grabbed!',
          sub: 'Bring the mouthpiece towards your lips',
        };

      case 'MOVING_TO_MOUTH':
        return {
          icon: <Flame className="w-5 h-5 text-cyan-400" />,
          title: 'Bring it to your lips',
          sub: 'Align the pipe tip with your mouth',
        };

      case 'PIPE_NEAR_MOUTH':
        return {
          icon: <Flame className="w-5 h-5 text-amber-400 animate-pulse" />,
          title: 'Hold steady to inhale...',
          sub: 'Keep the pipe close to your mouth',
        };

      case 'INHALING':
        return {
          icon: <Flame className="w-5 h-5 text-red-400 animate-ping" />,
          title: 'Inhaling Draw...',
          sub: 'Listen to the water bubbling and coal glowing',
        };

      case 'INHALED':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: 'Inhale Complete!',
          sub: 'Move the pipe away from your face',
        };

      case 'EXHALE_READY':
        return {
          icon: <Wind className="w-5 h-5 text-cyan-400 animate-pulse" />,
          title: 'Now Exhale / Blow!',
          sub: 'Pucker your lips and blow out into the air',
        };

      case 'BLOW_DETECTED':
      case 'SMOKE_ACTIVE':
        return {
          icon: <Wind className="w-5 h-5 text-white animate-spin" />,
          title: 'Exhaling Smooth Smoke Plumes',
          sub: 'Watch the thick cloud billow and expand',
        };

      case 'SMOKE_COOLDOWN':
        return {
          icon: <Sparkles className="w-5 h-5 text-slate-300" />,
          title: 'Smoke dissipating...',
          sub: 'Get ready for your next puff',
        };

      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-400" />,
          title: 'Virtual Hookah Lounge',
          sub: 'Interact with your camera',
        };
    }
  };

  const instruction = getInstruction();

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
      <div className="glass-panel px-6 py-3.5 rounded-full flex items-center gap-3.5 shadow-2xl border border-white/10 backdrop-blur-xl animate-fade-in transition-all duration-300">
        <div className="p-2 rounded-full bg-white/5 border border-white/10">
          {instruction.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white tracking-wide">
            {instruction.title}
          </span>
          <span className="text-xs text-slate-400">
            {instruction.sub}
          </span>
        </div>
      </div>

      {/* Auxiliary warnings if user face or hand is not visible */}
      {state === 'READY_TO_GRAB' && !isHandDetected && (
        <span className="mt-2 text-[11px] text-amber-300/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-amber-500/20 animate-pulse">
          Hand not detected in frame
        </span>
      )}
      {(state === 'PIPE_GRABBED' || state === 'MOVING_TO_MOUTH') && !isFaceDetected && (
        <span className="mt-2 text-[11px] text-cyan-300/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-cyan-500/20 animate-pulse">
          Center your face in the camera frame
        </span>
      )}
    </div>
  );
};
