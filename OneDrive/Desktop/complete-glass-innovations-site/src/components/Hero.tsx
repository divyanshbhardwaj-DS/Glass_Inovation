import Icon from './Icon';
import { img } from '../data/images';
import { company } from '../data/content';

const ticks = ['01', '02', '03', '04'];

export default function Hero() {
  return (
    <section id="home" className="relative bg-ink pt-20 lg:pt-0">
      <div className="grid lg:grid-cols-[minmax(0,560px)_1fr] min-h-[640px] lg:min-h-screen">
        {/* Left panel */}
        <div className="relative flex items-center py-16 lg:py-0">
          <div className="hidden lg:flex flex-col gap-6 absolute left-10 top-1/2 -translate-y-1/2">
            {ticks.map((t, i) => (
              <span key={t} className={`flex items-center gap-2 text-xs font-mono tracking-widest ${i === 0 ? 'text-gold' : 'text-white/25'}`}>
                {t}
                <span className={`inline-block w-4 h-px ${i === 0 ? 'bg-gold' : 'bg-white/25'}`} />
              </span>
            ))}
          </div>
          <div className="container-x lg:pl-20 lg:pr-12 max-w-xl">
            <p className="eyebrow mb-6">Premium Glass Solutions</p>
            <h1 className="font-display text-white font-extrabold uppercase leading-[1.05] text-4xl sm:text-5xl xl:text-[3.4rem] tracking-tight">
              Glass that<br />transforms spaces
            </h1>
            <p className="mt-6 text-white/60 text-[15px] leading-relaxed max-w-md">
              We deliver exceptional glass solutions with precision, safety and elegance for homes and businesses across the Gold Coast.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#projects" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-ink font-bold text-sm tracking-wide px-7 py-4 transition-colors">
                Explore Our Work <Icon name="arrow" className="w-4 h-4" />
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 border border-white/25 hover:border-white/60 text-white font-bold text-sm tracking-wide px-7 py-4 transition-colors">
                Get a Free Quote
              </a>
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className="relative min-h-[360px] lg:min-h-0">
          <img
            src={img.heroPool}
            alt="Modern glass-walled home with an infinity pool overlooking the coast at dusk"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent lg:from-ink/20" />

          <div className="hidden xl:flex flex-col absolute right-0 top-1/2 -translate-y-1/2 bg-ink/90 backdrop-blur text-white">
            {[
              { icon: 'phone' as const, label: 'Call Us', href: `tel:${company.phone.replace(/\s/g, '')}` },
              { icon: 'whatsapp' as const, label: 'WhatsApp', href: `https://wa.me/${company.phone.replace(/\D/g, '')}` },
              { icon: 'mail' as const, label: 'Email Us', href: `mailto:${company.email}` },
            ].map((b) => (
              <a key={b.label} href={b.href} className="flex flex-col items-center gap-2 px-5 py-4 border-b border-white/10 last:border-0 hover:bg-gold hover:text-ink transition-colors">
                <Icon name={b.icon} className="w-4 h-4" />
                <span className="text-[10px] tracking-widest">{b.label.toUpperCase()}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
