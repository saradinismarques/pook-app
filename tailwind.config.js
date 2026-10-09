/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#FBF6EF',
        night: '#15110E',
        sand: '#F3EADB',
        coal: '#241D17',
        ink: '#2B211A',
        haze: '#F5EDE3',
        taupe: '#7C6B5A',
        fog: '#AC9C8B',
        ember: '#C0562F',
        flame: '#E07A5F',
        'on-ember': '#FFFFFF',
        'on-flame': '#2B1710',
        edge: '#E5D9C6',
        'edge-dark': '#3B322B',
      },
      maxWidth: {
        content: '800px',
        actions: '420px',
        card: '340px',
      },
      fontSize: {
        wordmark: ['46px', { lineHeight: '54px' }],
        tagline: ['18px', { lineHeight: '26px' }],
        button: ['17px', { lineHeight: '24px' }],
      },
      minHeight: {
        button: '56px',
      },
    },
  },
  plugins: [],
};
