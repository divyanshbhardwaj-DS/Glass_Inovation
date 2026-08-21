import { useState } from 'react';
import Icon from './Icon';
import { testimonials } from '../data/content';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const move = (dir: 1 | -1) => setIndex((i) => (i + dir + testimonials.length) % testimonials.length);

  return (
    <section className="bg-paper py-24">
      <div className="container-x">
        <div className="text-center max-w-xl mx-auto reveal">
          <p className="eyebrow justify-center mb-5">Testimonials</p>
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-charcoal">What our customers say</h2>
        </div>

        <div className="mt-14 relative">
          <div className="hidden md:grid grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TCard key={t.name} t={t} />
            ))}
          </div>

          <div className="md:hidden">
            <TCard t={testimonials[index]} />
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => move(-1)} aria-label="Previous testimonial" className="w-10 h-10 border border-line flex items-center justify-center text-charcoal">
                <Icon name="arrow" className="w-4 h-4 rotate-180" />
              </button>
              <button onClick={() => move(1)} aria-label="Next testimonial" className="w-10 h-10 border border-line flex items-center justify-center text-charcoal">
                <Icon name="arrow" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="reveal bg-mist border border-line p-8">
      <div className="flex gap-1 text-gold">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Icon key={i} name="star" className="w-4 h-4" />
        ))}
      </div>
      <p className="mt-5 text-charcoal/80 leading-relaxed text-[15px]">&ldquo;{t.quote}&rdquo;</p>
      <p className="mt-6 font-display font-bold text-charcoal">— {t.name}</p>
    </div>
  );
}
