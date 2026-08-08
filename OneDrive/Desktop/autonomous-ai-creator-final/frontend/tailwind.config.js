/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0d10',
          900: '#12151a',
          850: '#161a20',
          800: '#1a1e26',
          700: '#272c35',
          600: '#39404c',
          500: '#4f5866',
          400: '#727c8c',
          300: '#9aa3b2',
          200: '#c7ccd6',
          100: '#e4e6ea',
        },
        paper: {
          100: '#eeece4',
          400: '#a9a495',
        },
        signal: { 500: '#3fd6c4', 400: '#6fe3d5', bg: '#0c2320' },
        publish: { 500: '#3ecf8e', 400: '#6bdca8', bg: '#0e2419' },
        reject: { 500: '#ff5c5c', 400: '#ff8a8a', bg: '#2a1414' },
        defer: { 500: '#f5a623', 400: '#f8bc57', bg: '#2a1f0d' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
