import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...fontFamily.sans]
      },
      colors: {
        brand: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};

export default config;
