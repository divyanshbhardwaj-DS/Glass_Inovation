import type { ReactElement } from 'react';

type IconProps = { name: IconName; className?: string };

export type IconName =
  | 'phone' | 'whatsapp' | 'mail' | 'pin' | 'clock' | 'menu' | 'close' | 'arrow'
  | 'shower' | 'window' | 'balustrade' | 'mirror' | 'splashback' | 'building'
  | 'shield' | 'gear' | 'users' | 'heart' | 'star' | 'check' | 'expand' | 'facebook' | 'instagram';

const paths: Record<IconName, ReactElement> = {
  phone: <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />,
  whatsapp: <path d="M4 20l1.4-4A8 8 0 1 1 9 19l-5 1ZM8.5 8.5c0 4 3 7 7 7 .8 0 1.5-.7 1.5-1.5V13l-2.5-1-1 1.5c-1.2-.6-2.4-1.8-3-3L11.5 9l-1-2.5H9C8.2 6.5 8.5 7.7 8.5 8.5Z" />,
  mail: <path d="M3 6h18v12H3V6Zm0 0 9 7 9-7" />,
  pin: <path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  clock: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  shower: <path d="M6 3h12M8 3v3m8-3v3M6 8h12v13H6V8Zm2 4h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />,
  window: <path d="M4 4h16v16H4V4Zm0 8h16M12 4v16" />,
  balustrade: <path d="M4 21V9l8-6 8 6v12M8 21V11m4 10V9m4 12V11M4 21h16" />,
  mirror: <path d="M8 3h8l3 6-7 12L5 9l3-6Zm0 0 4 6 4-6M5 9h14" />,
  splashback: <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14M4 20h16M8 4v16m8-16v16" />,
  building: <path d="M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M6 21h14M14 21v-7h4v7M9 7h.01M9 11h.01M9 15h.01" />,
  shield: <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />,
  gear: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.9-1.7L14 2h-4l-.5 2.6a8 8 0 0 0-2.9 1.7l-2.4-1-2 3.4 2 1.6A8 8 0 0 0 4 12c0 .6.1 1.1.2 1.7l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.9 1.7L10 22h4l.5-2.6a8 8 0 0 0 2.9-1.7l2.4 1 2-3.4-2-1.6c.1-.6.2-1.1.2-1.7Z" />,
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
  heart: <path d="M12 21s-7-4.4-9.5-9C.7 8.4 2.6 5 6 5c2 0 3.4 1 4.5 2.5C11.6 6 13 5 15 5c3.4 0 5.3 3.4 3.5 7-2.5 4.6-9.5 9-9.5 9Z" />,
  star: <path d="M12 2.5l3 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7l-6.1 3.3 1.3-6.8-5-4.7 6.8-.8 3-6.2Z" />,
  check: <path d="M5 13l4 4L19 7" />,
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />,
  facebook: <path d="M14 9h3V6h-3a3 3 0 0 0-3 3v2H9v3h2v7h3v-7h3l1-3h-4v-2a1 1 0 0 1 1-1Z" />,
  instagram: <path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm8 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm4.5-8.8h.01" />,
};

const filled = new Set<IconName>(['star']);

export default function Icon({ name, className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled.has(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
