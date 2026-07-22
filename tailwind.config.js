/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Awardee.id brand system — matches awardee-id/index.html (the marketing site).
        // Gold #F4CC46 sampled from a real @awardee.id IG post; navy is Apple-style near-black.
        navy: {
          DEFAULT: '#1d1d1f',
          2: '#000000',
        },
        gold: {
          DEFAULT: '#F4CC46',
          2: '#D9A916',
        },
        off: '#FFFBEF',
        ink: '#1d1d1f',
        muted: '#86868b',
        hairline: '#d2d2d7',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '980px',
      },
      boxShadow: {
        brand: '0 4px 24px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}
