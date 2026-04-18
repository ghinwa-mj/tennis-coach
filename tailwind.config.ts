import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          50: '#FAFAF5',
          100: '#FAF0E6',
          200: '#F2CC8F',
          300: '#E07A5F',
          400: '#C15642',
          500: '#9D3E2E',
        },
        wimbledon: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
        },
        ausopen: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          400: '#42A5F5',
          500: '#1E88E5',
          600: '#1976D2',
        },
        navy: {
          50: '#3D405B',
          500: '#2D3142',
          900: '#1A1C29',
        },
        primary: {
          DEFAULT: '#E07A5F',
          dark: '#C15642',
        },
        secondary: '#1B4D3E',
        accent: '#2D3142',
      },
      fontFamily: {
        heading: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-source-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
