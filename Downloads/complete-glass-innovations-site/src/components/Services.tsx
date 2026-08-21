import Icon from './Icon';
import { services } from '../data/content';
import type { IconName } from './Icon';

const iconFor: Record<string, IconName> = {
  shower: 'shower',
  windows: 'window',
  balustrades: 'balustrade',
  mirrors: 'mirror',
  splashbacks: 'splashback',
  commercial: 'building',
};

export default function Services() {
  return (
    <section id="services" className="bg-mist py-24 lg:py-32">
      <div className="container-x">
        <div className="text-center max-w-xl mx-auto reveal">
          <p className="eyebrow justify-center mb-5">Our Services</p>
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-charcoal">
            Solutions in glass, designed for you
          </h2>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <article
              key={s.id}
              className="reveal group bg-paper border border-line overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-3 left-4 w-10 h-10 bg-gold flex items-center justify-center text-ink">
                  <Icon name={iconFor[s.id]} className="w-5 h-5" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold uppercase text-sm tracking-wide text-charcoal">{s.title}</h3>
                <p className="mt-2 text-sm text-slate leading-relaxed">{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
