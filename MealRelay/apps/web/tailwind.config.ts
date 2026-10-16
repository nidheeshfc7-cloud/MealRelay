import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#003F2F',
          dark: '#002F24',
          mid: '#143928',
          light: '#245C40',
        },
        lime: {
          DEFAULT: '#D5FB53',
          soft: '#E6FCA8',
        },
        ivory: {
          DEFAULT: '#F7F7F1',
          pure: '#FFFFFF',
        },
        canvas: '#F6F7F1',
        ink: {
          DEFAULT: '#172A21',
          secondary: '#718078',
          muted: '#8B9C92',
        },
        line: {
          light: '#E5EBE1',
          dark: '#123D2E',
        },
        sage: '#EDF2E7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
