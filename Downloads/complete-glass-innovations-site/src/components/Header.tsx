import { useEffect, useState } from 'react';
import Icon from './Icon';
import { nav, company } from '../data/content';

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#home" className="flex items-center gap-3 shrink-0">
      <svg viewBox="0 0 40 40" className="w-9 h-9" aria-hidden="true">
        <rect x="6" y="4" width="22" height="22" fill="none" stroke="var(--color-gold)" strokeWidth="2.4" />
        <rect x="12" y="14" width="22" height="22" fill="none" stroke={dark ? '#ffffff' : '#191d24'} strokeWidth="2.4" />
      </svg>
      <span className="font-display leading-tight">
        <span className={`block text-[11px] tracking-[0.22em] ${dark ? 'text-white/70' : 'text-charcoal/70'}`}>COMPLETE</span>
        <span className={`block text-lg font-extrabold tracking-tight -mt-0.5 ${dark ? 'text-white' : 'text-charcoal'}`}>GLASS<span className="text-gold"> INNOVATIONS</span></span>
      </span>
    </a>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('#home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = nav.map((n) => document.querySelector(n.href)).filter(Boolean) as Element[];
    const onScroll = () => {
      const pos = window.scrollY + 140;
      let current = sections[0];
      sections.forEach((sec) => {
        if ((sec as HTMLElement).offsetTop <= pos) current = sec;
      });
      if (current) setActive('#' + current.id);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-ink/95 backdrop-blur border-b border-line-dark' : 'bg-transparent'
      }`}
    >
      <div className="container-x flex items-center justify-between h-20">
        <Logo dark />
        <nav className="hidden lg:flex items-center gap-9">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors relative py-1 ${
                active === item.href ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {item.label}
              {active === item.href && (
                <span className="absolute left-0 right-0 -bottom-1 h-[1.5px] bg-gold" />
              )}
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="#contact"
            className="bg-gold hover:bg-gold-dark text-ink text-sm font-bold tracking-wide px-6 py-3 transition-colors"
          >
            GET A FREE QUOTE
          </a>
        </div>
        <button
          className="lg:hidden text-white p-2"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} className="w-6 h-6" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-ink border-t border-line-dark">
          <nav className="container-x flex flex-col py-4">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-white/85 border-b border-line-dark last:border-0 text-sm tracking-wide"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-4 bg-gold text-ink text-center text-sm font-bold tracking-wide px-6 py-3"
            >
              GET A FREE QUOTE
            </a>
            <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="mt-4 text-white/60 text-sm">
              {company.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
