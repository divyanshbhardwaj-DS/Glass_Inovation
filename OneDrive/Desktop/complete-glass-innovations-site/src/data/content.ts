import { img } from './images';

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact Us', href: '#contact' },
];

export const stats = [
  { value: '10+', label: 'Years of Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '100%', label: 'Customer Satisfaction' },
];

export type Service = {
  id: string;
  title: string;
  desc: string;
  image: string;
};

export const services: Service[] = [
  { id: 'shower', title: 'Shower Screens', desc: 'Stylish and durable frameless shower screens for a clean, modern look.', image: img.shower },
  { id: 'windows', title: 'Windows & Doors', desc: 'High-quality glass windows and doors for homes and commercial spaces.', image: img.heroPool },
  { id: 'balustrades', title: 'Balustrades', desc: 'Frameless glass balustrades that combine safety with elegance.', image: img.poolBalustrade },
  { id: 'mirrors', title: 'Mirrors', desc: 'Custom-cut mirrors for bathrooms, gyms, living rooms and more.', image: img.mirror },
  { id: 'splashbacks', title: 'Splashbacks', desc: 'Premium glass splashbacks for kitchens and commercial areas.', image: img.splashback },
  { id: 'commercial', title: 'Commercial Glass', desc: 'Complete glass solutions for offices, shops and commercial buildings.', image: img.commercial },
];

export const values = [
  { title: 'Quality Workmanship', desc: 'We use premium materials and deliver flawless workmanship every time.' },
  { title: 'Custom Solutions', desc: 'Every project is custom-designed to suit your space, style and requirements.' },
  { title: 'Professional Service', desc: 'Our team is skilled, reliable and committed to delivering the best experience.' },
  { title: 'Customer Satisfaction', desc: 'Your satisfaction is our priority — we go the extra mile to exceed expectations.' },
];

export type Project = {
  id: string;
  title: string;
  category: 'Residential' | 'Commercial' | 'Shower Screens' | 'Balustrades';
  location: string;
  image: string;
  size: 'wide' | 'tall' | 'normal';
};

export const projects: Project[] = [
  { id: 'p1', title: 'Cliffside glass balustrade', category: 'Balustrades', location: 'Burleigh Heads, QLD', image: img.poolBalustrade, size: 'wide' },
  { id: 'p2', title: 'Frameless ensuite screen', category: 'Shower Screens', location: 'Broadbeach, QLD', image: img.shower, size: 'normal' },
  { id: 'p3', title: 'Waterfront staircase balustrade', category: 'Residential', location: 'Main Beach, QLD', image: img.staircase, size: 'tall' },
  { id: 'p4', title: 'Printed kitchen splashback', category: 'Residential', location: 'Robina, QLD', image: img.splashback, size: 'normal' },
  { id: 'p5', title: 'Corporate lobby glazing', category: 'Commercial', location: 'Surfers Paradise, QLD', image: img.commercial, size: 'normal' },
  { id: 'p6', title: 'Wardrobe mirror doors', category: 'Residential', location: 'Southport, QLD', image: img.mirror, size: 'normal' },
];

export const process = [
  { step: '01', title: 'Get in Touch', desc: 'Contact us and tell us about your project.' },
  { step: '02', title: 'Consultation', desc: 'We assess your needs and provide expert advice.' },
  { step: '03', title: 'Installation', desc: 'Our skilled team completes the installation.' },
  { step: '04', title: 'Enjoy Your Space', desc: 'Sit back and enjoy your beautiful new glass solution.' },
];

export const testimonials = [
  { name: 'Sarah M.', quote: 'Excellent service and high quality work. The team was professional and the results are amazing.', rating: 5 },
  { name: 'Jason T.', quote: 'Very happy with our new shower screen. Great communication and attention to detail.', rating: 5 },
  { name: 'Emily R.', quote: 'Highly recommend Complete Glass Innovations — quality work and responsive service.', rating: 5 },
];

export const footerServices = ['Shower Screens', 'Windows & Doors', 'Balustrades', 'Mirrors', 'Splashbacks', 'Commercial Glass'];
export const footerLinks = ['Home', 'About Us', 'Services', 'Projects', 'Contact Us'];

export const company = {
  name: 'Complete Glass',
  suffix: 'Innovations',
  phone: '0402 233 866',
  email: 'info@completeglassinnovations.com.au',
  address: 'Gold Coast, Queensland, Australia',
  hoursWeek: 'Mon – Fri, 7:30 AM – 5:00 PM',
  hoursSat: 'Saturday, 8:00 AM – 12:00 PM',
};
