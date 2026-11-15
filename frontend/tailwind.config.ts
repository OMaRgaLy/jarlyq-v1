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
        // Deep teal, taken from the Lovable mock-up (navy header, teal call-to-action).
        brand: {
          light: '#2a9fb2',
          DEFAULT: '#157a8c',
          dark: '#0e5f6f'
        },
        ink: {
          DEFAULT: '#0a2540',
          deep: '#03233f'
        }
      }
    }
  },
  plugins: []
};

export default config;
