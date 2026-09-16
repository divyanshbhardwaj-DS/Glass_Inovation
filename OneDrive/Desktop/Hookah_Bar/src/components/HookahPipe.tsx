import React from 'react';
import type { Point2D, HookahConfig } from '../types';

interface HookahPipeProps {
  pipePos: Point2D; // Screen pixel coordinates of the pipe grab/center
  hoseOrigin: Point2D; // Screen pixel coordinates of the hookah base outlet
  angle: number; // Angle of pipe handle in radians
  isGrabbed: boolean;
  isNearMouth: boolean;
  isInhaling: boolean;
  config: HookahConfig;
}

export const HookahPipe: React.FC<HookahPipeProps> = ({
  pipePos,
  hoseOrigin,
  angle,
  isGrabbed,
  isNearMouth,
  isInhaling,
  config,
}) => {
  // Pipe dimensions in screen pixels
  const pipeLength = 90;
  const bottomX = pipePos.x - Math.sin(angle) * (pipeLength / 2);
  const bottomY = pipePos.y + Math.cos(angle) * (pipeLength / 2);

  // Compute dynamic catenary / cubic Bézier curve for flexible hose with gravity sag
  const dx = bottomX - hoseOrigin.x;
  const dy = bottomY - hoseOrigin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const sag = Math.min(180, Math.max(50, dist * 0.38));

  const cp1x = hoseOrigin.x + dx * 0.25;
  const cp1y = hoseOrigin.y + sag;
  const cp2x = bottomX - dx * 0.25;
  const cp2y = bottomY + sag * 0.7;

  const hosePath = `M ${hoseOrigin.x} ${hoseOrigin.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${bottomX} ${bottomY}`;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {/* 1. FLEXIBLE HOSE (SVG Overlay across screen) */}
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <defs>
          <filter id="hoseShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Hose Drop Shadow */}
        <path
          d={hosePath}
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#hoseShadow)"
        />

        {/* Hose Outer Casing */}
        <path
          d={hosePath}
          fill="none"
          stroke={config.hoseColor}
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Hose Texture / Ridge Stripe */}
        <path
          d={hosePath}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />

        {/* Hose Inhale Glow Pulse */}
        {isInhaling && (
          <path
            d={hosePath}
            fill="none"
            stroke={config.accentColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="12 16"
            className="animate-pulse"
            opacity="0.8"
          />
        )}
      </svg>

      {/* 2. PIPE HANDLE & MOUTHPIECE */}
      <div
        className="absolute transition-transform duration-75"
        style={{
          left: `${pipePos.x}px`,
          top: `${pipePos.y}px`,
          transform: `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI}deg)`,
        }}
      >
        {/* Grab Zone Target Pulse Ring (Only visible when ready to grab and not yet grabbed) */}
        {!isGrabbed && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-dashed border-amber-400/80 animate-spin" />
        )}

        {/* Pipe Handgrip Halo */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full transition-all duration-300 ${
            isGrabbed
              ? 'ring-4 ring-emerald-400/40 bg-emerald-400/10'
              : 'ring-2 ring-white/20 bg-white/5'
          }`}
        />

        {/* The Sleek Mouthpiece Pipe SVG */}
        <svg
          width="40"
          height="100"
          viewBox="0 0 40 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          {/* Mouthpiece Tip */}
          <path
            d="M17 4 L23 4 L22 18 L18 18 Z"
            fill={isNearMouth ? config.accentColor : '#e2e8f0'}
            stroke="#475569"
            strokeWidth="1"
          />
          {/* Tip Aperture */}
          <ellipse
            cx="20"
            cy="4"
            rx="3"
            ry="1.5"
            fill="#09090b"
            stroke={isNearMouth ? config.accentColor : '#94a3b8'}
            strokeWidth="0.8"
          />

          {/* Upper Metallic Ring */}
          <ellipse cx="20" cy="18" rx="4.5" ry="2" fill={config.accentColor} />

          {/* Main Ergonomic Grip Handle */}
          <path
            d="M16 20 L24 20 L25 80 L15 80 Z"
            fill="#1e293b"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
          />

          {/* Leather/Carbon Grip Ribbing */}
          <line x1="16" y1="32" x2="24" y2="32" stroke={config.accentColor} strokeWidth="1.5" />
          <line x1="16" y1="44" x2="24" y2="44" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <line x1="16" y1="56" x2="24" y2="56" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <line x1="16" y1="68" x2="24" y2="68" stroke={config.accentColor} strokeWidth="1.5" />

          {/* Base Hose Connector */}
          <ellipse cx="20" cy="82" rx="6" ry="3" fill="#475569" />
          <rect x="17" y="82" width="6" height="14" rx="2" fill="#0f172a" />
        </svg>

        {/* Tip Steam/Glow when inhaling */}
        {isInhaling && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full filter blur-sm animate-ping"
            style={{ backgroundColor: config.accentColor }}
          />
        )}
      </div>
    </div>
  );
};
