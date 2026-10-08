import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        rice: '#FAF7F0',
        porcelain: '#FFFFFF',
        citrus: '#F5B000',
        leaf: '#2F7D57',
        clay: '#B85C38',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
