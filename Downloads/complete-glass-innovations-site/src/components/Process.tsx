import Icon from './Icon';
import { process } from '../data/content';
import type { IconName } from './Icon';

const icons: IconName[] = ['phone', 'users', 'gear', 'check'];

export default function Process() {
  return (
    <section className="bg-mist py-24">
      <div className="container-x">
        <div className="text-center max-w-xl mx-auto reveal">
          <p className="eyebrow justify-center mb-5">Our Process</p>
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-charcoal">Simple steps. Stunning results.</h2>
        </div>

        <div className="mt-16 relative grid sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-line" />
          {process.map((p, i) => (
            <div key={p.step} className="reveal relative text-center flex flex-col items-center" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="relative z-10 w-14 h-14 rounded-full bg-paper border-2 border-gold flex items-center justify-center text-charcoal">
                <Icon name={icons[i]} className="w-5 h-5" />
              </div>
              <span className="mt-4 text-xs font-mono tracking-widest text-gold-dark">{p.step}</span>
              <h3 className="mt-1 font-display font-bold uppercase text-sm tracking-wide text-charcoal">{p.title}</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed max-w-[200px]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
