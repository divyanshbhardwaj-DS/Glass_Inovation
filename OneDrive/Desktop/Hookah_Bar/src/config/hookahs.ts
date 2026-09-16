import type { HookahConfig } from '../types';

export const HOOKAH_PRESETS: HookahConfig[] = [
  {
    id: 'classic',
    name: 'Classic Sultan',
    tagline: 'Traditional Middle-Eastern Lounge Craft',
    description: 'Hand-hammered brass stem, cut ruby-crystal glass base, with natural wood pipe accent.',
    flavor: 'Double Apple & Anise',
    accentColor: '#f59e0b', // Amber
    glowColor: 'rgba(245, 158, 11, 0.55)',
    smokeColor: 'rgba(240, 240, 245, 0.85)',
    smokeSecondaryColor: 'rgba(220, 215, 205, 0.4)',
    baseColor: '#881337', // Deep ruby
    stemColor: '#d97706', // Brass/Gold
    bowlColor: '#451a03', // Clay
    hoseColor: '#991b1b', // Burgundy velvet
    badge: 'Lounge Heritage',
  },
  {
    id: 'premium',
    name: 'Obsidian Royale',
    tagline: 'Luxury 24K Gold & Smoked Glass',
    description: 'Precision CNC-machined titanium, 24-karat gold fittings, and emerald ambient backlight.',
    flavor: 'Royal Mint & Persian Lime',
    accentColor: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.55)',
    smokeColor: 'rgba(245, 250, 248, 0.85)',
    smokeSecondaryColor: 'rgba(180, 220, 200, 0.35)',
    baseColor: '#064e3b', // Deep emerald
    stemColor: '#eab308', // 24k Gold
    bowlColor: '#18181b', // Obsidian
    hoseColor: '#047857', // Emerald leather
    badge: 'VIP Signature',
  },
  {
    id: 'neon',
    name: 'Cyber Shisha',
    tagline: 'Futuristic Tokyo Synthwave Lounge',
    description: 'Edge-lit acrylic chamber, pulsing LED core, and reactive neon cyber-hose.',
    flavor: 'Electric Blue Mist & Dragonfruit',
    accentColor: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.65)',
    smokeColor: 'rgba(230, 245, 255, 0.85)',
    smokeSecondaryColor: 'rgba(192, 132, 252, 0.45)', // Lavender / Magenta tint
    baseColor: '#0e7490', // Cyan glass
    stemColor: '#0284c7', // Anodized cyan
    bowlColor: '#3b0764', // Deep ultraviolet
    hoseColor: '#06b6d4', // Cyber glow blue
    badge: 'Cyberpunk Edition',
  },
  {
    id: 'modern',
    name: 'Minimalist Frost',
    tagline: 'Contemporary Architectural Design',
    description: 'Matte surgical stainless steel, frosted borosilicate glass, and clean Scandinavian lines.',
    flavor: 'Glacial Watermelon & Ice',
    accentColor: '#38bdf8', // Ice blue
    glowColor: 'rgba(56, 189, 248, 0.55)',
    smokeColor: 'rgba(248, 250, 252, 0.9)',
    smokeSecondaryColor: 'rgba(148, 163, 184, 0.35)',
    baseColor: '#1e293b', // Frosted slate
    stemColor: '#94a3b8', // Brushed steel
    bowlColor: '#334155', // Slate ceramic
    hoseColor: '#64748b', // Matte silicone
    badge: 'Nordic Clean',
  },
];
