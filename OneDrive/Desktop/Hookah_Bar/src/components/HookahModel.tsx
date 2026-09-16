import React from 'react';
import type { HookahConfig } from '../types';

interface HookahModelProps {
  config: HookahConfig;
  isBubbling: boolean;
  isInhaling: boolean;
}

export const HookahModel: React.FC<HookahModelProps> = ({
  config,
  isBubbling,
  isInhaling,
}) => {
  return (
    <div className="relative w-48 h-80 sm:w-56 sm:h-96 pointer-events-none select-none transition-all duration-500">
      {/* Ambient glow behind hookah */}
      <div
        className="absolute inset-0 rounded-full filter blur-3xl opacity-40 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          transform: isInhaling ? 'scale(1.2)' : 'scale(1)',
        }}
      />

      <svg
        viewBox="0 0 200 340"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glass Base Gradient */}
          <linearGradient id={`baseGrad-${config.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.baseColor} stopOpacity="0.85" />
            <stop offset="70%" stopColor="#0a0a0f" stopOpacity="0.95" />
            <stop offset="100%" stopColor={config.baseColor} stopOpacity="0.7" />
          </linearGradient>

          {/* Stem Metallic Gradient */}
          <linearGradient id={`stemGrad-${config.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={config.stemColor} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor={config.stemColor} />
          </linearGradient>

          {/* Glowing Coal Embers */}
          <radialGradient id="coalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#27272a" />
          </radialGradient>
        </defs>

        {/* 1. TOP BOWL & COALS */}
        <g id="bowl-group">
          {/* Coal smoke wisps when inhaling */}
          {isInhaling && (
            <g className="animate-pulse">
              <circle cx="100" cy="24" r="5" fill="#ffffff" opacity="0.2" />
              <circle cx="94" cy="18" r="7" fill="#ffffff" opacity="0.15" />
              <circle cx="106" cy="14" r="9" fill="#ffffff" opacity="0.1" />
            </g>
          )}

          {/* Clay/Obsidian Bowl */}
          <path
            d="M80 46 L86 64 L114 64 L120 46 Q100 42 80 46 Z"
            fill={config.bowlColor}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />

          {/* Charcoal Cubes */}
          <rect
            x="89"
            y="35"
            width="10"
            height="9"
            rx="1.5"
            fill="url(#coalGlow)"
            className={isInhaling ? 'ember-pulse' : ''}
          />
          <rect
            x="101"
            y="36"
            width="10"
            height="9"
            rx="1.5"
            fill="url(#coalGlow)"
            className={isInhaling ? 'ember-pulse' : ''}
          />
          <rect
            x="95"
            y="29"
            width="9"
            height="8"
            rx="1.5"
            fill="url(#coalGlow)"
            className={isInhaling ? 'ember-pulse' : ''}
          />

          {/* Tray (Ashtray plate) */}
          <ellipse
            cx="100"
            cy="66"
            rx="36"
            ry="6"
            fill={`url(#stemGrad-${config.id})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          <ellipse cx="100" cy="65" rx="34" ry="4" fill="#18181b" opacity="0.4" />
        </g>

        {/* 2. METALLIC STEM / COLUMN */}
        <g id="stem-group">
          {/* Main vertical shaft */}
          <rect
            x="94"
            y="68"
            width="12"
            height="115"
            rx="2"
            fill={`url(#stemGrad-${config.id})`}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
          />

          {/* Ornate Rings / Accents */}
          <ellipse cx="100" cy="90" rx="14" ry="5" fill={config.accentColor} />
          <ellipse cx="100" cy="120" rx="16" ry="6" fill={`url(#stemGrad-${config.id})`} />
          <ellipse cx="100" cy="150" rx="13" ry="5" fill={config.accentColor} />

          {/* Heart / Chamber Hub */}
          <path
            d="M82 178 Q100 170 118 178 L122 195 Q100 200 78 195 Z"
            fill={`url(#stemGrad-${config.id})`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Hose Port Outlet (where the flexible hose originates) */}
          <circle
            cx="78"
            cy="188"
            r="8"
            fill="#27272a"
            stroke={config.accentColor}
            strokeWidth="2"
          />
          {/* Purge Valve on opposite side */}
          <circle cx="122" cy="188" r="5" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
        </g>

        {/* 3. GLASS BASE VESSEL */}
        <g id="base-group">
          {/* Vase Body */}
          <path
            d="M82 195 C82 210, 60 230, 48 275 C40 305, 52 325, 100 325 C148 325, 160 305, 152 275 C140 230, 118 210, 118 195 Z"
            fill={`url(#baseGrad-${config.id})`}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
          />

          {/* Water Level & Interior Glass Glow */}
          <path
            d="M54 270 C48 295, 58 316, 100 316 C142 316, 152 295, 146 270 C138 255, 125 248, 100 248 C75 248, 62 255, 54 270 Z"
            fill={config.glowColor}
            opacity={isInhaling ? '0.75' : '0.45'}
            className="transition-all duration-300"
          />

          {/* Downstem immersed in water */}
          <rect x="97" y="195" width="6" height="85" fill={`url(#stemGrad-${config.id})`} opacity="0.75" />

          {/* Rising Water Bubbles when bubbling */}
          {isBubbling && (
            <g id="bubbles">
              <circle cx="95" cy="275" r="3.5" fill="#ffffff" className="bubble-anim" style={{ animationDelay: '0.1s' }} />
              <circle cx="104" cy="278" r="4.5" fill="#ffffff" className="bubble-anim" style={{ animationDelay: '0.35s' }} />
              <circle cx="92" cy="265" r="3" fill="#ffffff" className="bubble-anim" style={{ animationDelay: '0.6s' }} />
              <circle cx="107" cy="262" r="5" fill="#ffffff" className="bubble-anim" style={{ animationDelay: '0.8s' }} />
              <circle cx="98" cy="255" r="4" fill="#ffffff" className="bubble-anim" style={{ animationDelay: '0.2s' }} />
            </g>
          )}

          {/* Glass Highlights / Reflections */}
          <path
            d="M60 270 C54 290, 62 310, 75 315"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};
