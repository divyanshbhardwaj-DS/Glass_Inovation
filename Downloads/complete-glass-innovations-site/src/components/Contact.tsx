import { useState } from 'react';
import Icon from './Icon';
import { img } from '../data/images';
import { company } from '../data/content';

const jobTypes = ['Shower Screens', 'Windows & Doors', 'Balustrades', 'Mirrors', 'Splashbacks', 'Commercial Glass', 'Other'];

export default function Contact() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const body = [
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      `Email: ${data.get('email')}`,
      `Service required: ${data.get('service')}`,
      '',
      String(data.get('message') || ''),
    ].join('\n');
    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent('Quote request — ' + data.get('service'))}&body=${encodeURIComponent(body)}`;
    setSent(true);
    form.reset();
  };

  return (
    <section id="contact" className="bg-ink">
      {/* CTA */}
      <div className="relative py-20 text-center overflow-hidden">
        <img src={img.staircase} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/95 to-ink" />
        <div className="container-x relative reveal">
          <h2 className="font-display font-extrabold uppercase text-3xl sm:text-4xl text-white">Ready to transform your space?</h2>
          <p className="mt-4 text-white/55">Get in touch with us today for a free, no-obligation quote.</p>
          <a href="#quote-form" className="mt-8 inline-block bg-gold hover:bg-gold-dark text-ink font-bold text-sm tracking-wide px-8 py-4 transition-colors">
            Request a Free Quote
          </a>
        </div>
      </div>

      {/* Form + info */}
      <div className="container-x pb-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 -mt-4">
          <form id="quote-form" onSubmit={onSubmit} className="reveal bg-paper p-8 sm:p-10">
            <p className="eyebrow mb-2">Get Your Free Quote</p>
            <h3 className="font-display font-bold text-2xl text-charcoal">Tell us about your project</h3>

            <div className="mt-7 grid sm:grid-cols-2 gap-5">
              <Field label="Full Name" name="name" required />
              <Field label="Phone Number" name="phone" type="tel" required />
              <Field label="Email Address" name="email" type="email" required />
              <SelectField label="Service Required" name="service" options={jobTypes} />
            </div>
            <div className="mt-5">
              <label className="block text-xs font-bold tracking-wide text-slate uppercase mb-2">Message</label>
              <textarea
                name="message"
                rows={4}
                className="w-full border border-line bg-mist/40 px-4 py-3 text-sm text-charcoal focus:border-gold outline-none transition-colors"
                placeholder="Tell us about your project…"
              />
            </div>
            <button type="submit" className="mt-7 bg-charcoal hover:bg-ink text-white font-bold text-sm tracking-wide px-8 py-4 transition-colors">
              Send Enquiry
            </button>
            {sent && <p className="mt-4 text-sm text-gold-dark">Thanks — your email client should now be open to send your enquiry.</p>}
          </form>

          <div className="reveal bg-ink-2 border border-line-dark text-white p-8 sm:p-10 flex flex-col">
            <p className="eyebrow mb-2">Contact Information</p>
            <h3 className="font-display font-bold text-2xl">Get in touch</h3>

            <ul className="mt-7 space-y-5 text-sm">
              <li className="flex items-start gap-3">
                <Icon name="phone" className="w-4 h-4 text-gold mt-1 shrink-0" />
                <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="text-white/80 hover:text-white">{company.phone}</a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="mail" className="w-4 h-4 text-gold mt-1 shrink-0" />
                <a href={`mailto:${company.email}`} className="text-white/80 hover:text-white break-all">{company.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="pin" className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="text-white/80">{company.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="clock" className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="text-white/80">{company.hoursWeek}<br />{company.hoursSat}</span>
              </li>
            </ul>

            <div className="mt-8 flex-1 min-h-[140px] border border-line-dark bg-ink relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="pin" className="w-7 h-7 text-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold tracking-wide text-slate uppercase mb-2">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full border border-line bg-mist/40 px-4 py-3 text-sm text-charcoal focus:border-gold outline-none transition-colors"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-bold tracking-wide text-slate uppercase mb-2">{label}</label>
      <select name={name} className="w-full border border-line bg-mist/40 px-4 py-3 text-sm text-charcoal focus:border-gold outline-none transition-colors">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
