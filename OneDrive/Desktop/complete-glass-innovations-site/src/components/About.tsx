import { img } from '../data/images';
import { stats } from '../data/content';

export default function About() {
  return (
    <section id="about" className="bg-paper py-24 lg:py-32">
      <div className="container-x grid lg:grid-cols-2 gap-16 items-center">
        <div className="reveal relative grid grid-cols-2 gap-4 max-w-lg">
          <img src={img.staircase} alt="Frameless glass staircase balustrade in a modern home" className="col-span-2 h-64 object-cover" />
          <img src={img.shower} alt="Frameless glass shower screen installation" className="h-40 object-cover" />
          <div className="bg-mist border border-line p-5 flex flex-col justify-center">
            <p className="eyebrow !text-[11px] mb-2">Quality</p>
            <p className="font-display font-semibold text-charcoal text-lg leading-snug">Crafted with precision. Built to last.</p>
          </div>
        </div>

        <div className="reveal">
          <p className="eyebrow mb-5">About Us</p>
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl leading-tight text-charcoal">
            Clear solutions.<br />Perfect results.
          </h2>
          <p className="mt-6 text-slate leading-relaxed max-w-md">
            At Complete Glass Innovations, we specialise in high-quality glass installations that enhance the beauty, safety and value of your property — from shower screens to balustrades, windows, mirrors and custom commercial glazing.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md border-y border-line py-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display font-extrabold text-2xl sm:text-3xl text-charcoal">{s.value}</p>
                <p className="text-xs text-slate mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          <a href="#services" className="mt-10 inline-block bg-charcoal hover:bg-ink text-white text-sm font-bold tracking-wide px-7 py-4 transition-colors">
            More About Us
          </a>
        </div>
      </div>
    </section>
  );
}
