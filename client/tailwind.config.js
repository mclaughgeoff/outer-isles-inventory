/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        primary: { DEFAULT: '#6B7B44', hover: '#5A6A38' },
        secondary: '#C4956A',
        border: '#E5DED5',
        danger: '#C0564B',
        warning: '#D4A843',
        success: '#4A7C59',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        warm: '0 1px 3px rgba(139, 120, 95, 0.12), 0 1px 2px rgba(139, 120, 95, 0.06)',
        'warm-md': '0 4px 6px rgba(139, 120, 95, 0.1), 0 2px 4px rgba(139, 120, 95, 0.06)',
      },
    },
  },
  plugins: [],
};
