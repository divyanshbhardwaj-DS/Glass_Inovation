# Complete Glass Innovations — Website

A production-ready marketing site built with **React + TypeScript + Tailwind CSS v4 + Vite**, recreating the supplied reference design (dark hero, gold accent, glass-services grid, filterable project gallery, testimonials, and a working quote-request contact form).

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  components/   # Header, Hero, About, Services, ValuesStrip, Projects, Process, Testimonials, Contact, Footer, Icon
  data/         # content.ts (copy/data), images.ts (image URL registry)
  hooks/        # useReveal.ts (scroll-reveal animation)
  index.css     # design tokens (Tailwind v4 @theme) + base styles
```

## Notes

- All photography is sourced from Unsplash (free license, no attribution required) via stable `images.unsplash.com` CDN URLs — no local file paths or blob URLs are used, so the site works for any visitor on any device.
- The quote form opens the visitor's email client via a `mailto:` link pre-filled with their details. Swap this for a real form backend (e.g. Formspree, a serverless function, or your CRM's API) when you're ready to go live.
- Fully responsive: desktop, laptop, tablet, and mobile layouts are handled with Tailwind breakpoints (`sm`, `lg`, `xl`), including a dedicated mobile nav.
- Respects `prefers-reduced-motion` for all scroll-reveal and hover animations.
