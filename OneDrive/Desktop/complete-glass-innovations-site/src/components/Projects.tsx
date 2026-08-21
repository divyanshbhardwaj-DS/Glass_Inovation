import { useMemo, useState } from 'react';
import Icon from './Icon';
import { projects, type Project } from '../data/content';

const categories = ['All', 'Residential', 'Commercial', 'Shower Screens', 'Balustrades'] as const;

export default function Projects() {
  const [filter, setFilter] = useState<(typeof categories)[number]>('All');
  const [active, setActive] = useState<Project | null>(null);

  const filtered = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.category === filter)),
    [filter]
  );

  return (
    <section id="projects" className="bg-paper py-24 lg:py-32">
      <div className="container-x">
        <div className="text-center max-w-xl mx-auto reveal">
          <p className="eyebrow justify-center mb-5">Our Projects</p>
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-charcoal">Explore our recent work</h2>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2 reveal">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase border transition-colors ${
                filter === c ? 'bg-charcoal text-white border-charcoal' : 'border-line text-slate hover:border-charcoal hover:text-charcoal'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 auto-rows-[220px] gap-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              className={`group relative overflow-hidden text-left focus-visible:outline-2 ${
                p.size === 'wide' ? 'sm:col-span-2' : p.size === 'tall' ? 'lg:row-span-2' : ''
              }`}
            >
              <img
                src={p.image}
                alt={p.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/15 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="expand" className="w-4 h-4" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[11px] font-bold tracking-widest text-gold uppercase">{p.category}</span>
                <h3 className="text-white font-display font-semibold mt-1">{p.title}</h3>
                <p className="text-white/60 text-xs mt-0.5">{p.location}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#contact" className="inline-flex items-center gap-2 border border-charcoal text-charcoal hover:bg-charcoal hover:text-white text-sm font-bold tracking-wide px-7 py-4 transition-colors">
            View All Projects <Icon name="arrow" className="w-4 h-4" />
          </a>
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute -top-11 right-0 text-white/70 hover:text-white p-2"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
            <img src={active.image} alt={active.title} className="w-full max-h-[70vh] object-cover" />
            <div className="bg-paper p-6">
              <span className="text-[11px] font-bold tracking-widest text-gold-dark uppercase">{active.category}</span>
              <h3 className="font-display font-bold text-xl mt-1 text-charcoal">{active.title}</h3>
              <p className="text-slate text-sm mt-1">{active.location}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
