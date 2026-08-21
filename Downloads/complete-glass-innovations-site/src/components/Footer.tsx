import Icon from './Icon';
import { footerLinks, footerServices, company } from '../data/content';

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-line-dark pt-16 pb-8">
      <div className="container-x grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
              <rect x="6" y="4" width="22" height="22" fill="none" stroke="var(--color-gold)" strokeWidth="2.4" />
              <rect x="12" y="14" width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2.4" />
            </svg>
            <span className="font-display font-extrabold text-white tracking-tight">COMPLETE GLASS</span>
          </div>
          <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
            We provide high-quality glass solutions with a focus on professional workmanship, modern design and customer satisfaction.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="Facebook" className="w-9 h-9 border border-line-dark flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-colors">
              <Icon name="facebook" className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Instagram" className="w-9 h-9 border border-line-dark flex items-center justify-center text-white/70 hover:text-gold hover:border-gold transition-colors">
              <Icon name="instagram" className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-display font-bold text-sm tracking-wide uppercase">Quick Links</h4>
          <ul className="mt-5 space-y-3">
            {footerLinks.map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase().replace(/\s/g, '-').replace('-us', '')}`} className="text-sm text-white/50 hover:text-gold transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-display font-bold text-sm tracking-wide uppercase">Services</h4>
          <ul className="mt-5 space-y-3">
            {footerServices.map((s) => (
              <li key={s}>
                <a href="#services" className="text-sm text-white/50 hover:text-gold transition-colors">{s}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-display font-bold text-sm tracking-wide uppercase">Contact</h4>
          <ul className="mt-5 space-y-3 text-sm text-white/50">
            <li>{company.phone}</li>
            <li className="break-all">{company.email}</li>
            <li>{company.address}</li>
          </ul>
        </div>
      </div>

      <div className="container-x mt-14 pt-6 border-t border-line-dark text-xs text-white/35 flex flex-col sm:flex-row gap-2 justify-between">
        <span>© {new Date().getFullYear()} Complete Glass Innovations. All rights reserved.</span>
        <span>Photography via Unsplash</span>
      </div>
    </footer>
  );
}
