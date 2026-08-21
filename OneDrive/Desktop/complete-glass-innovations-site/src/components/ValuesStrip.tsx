import Icon from './Icon';
import { values } from '../data/content';
import { img } from '../data/images';
import type { IconName } from './Icon';

const icons: IconName[] = ['shield', 'gear', 'users', 'heart'];

export default function ValuesStrip() {
  return (
    <section className="relative bg-ink py-16">
      <img src={img.commercial} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-15" />
      <div className="absolute inset-0 bg-ink/85" />
      <div className="container-x relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {values.map((v, i) => (
          <div key={v.title} className="reveal flex items-start gap-4" style={{ transitionDelay: `${i * 70}ms` }}>
            <Icon name={icons[i]} className="w-7 h-7 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-bold uppercase text-sm tracking-wide text-white">{v.title}</h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
