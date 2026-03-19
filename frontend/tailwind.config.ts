import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0f',
        'bg-surface': '#111118',
        'bg-elevated': '#1a1a24',
        'bg-border': '#2a2a3a',
        'node-file': '#00d4a0',
        'node-class': '#a78bfa',
        'node-function': '#38bdf8',
        'node-module': '#fb923c',
        'accent': '#5b4dff',
        'accent-hover': '#7060ff',
        'text-primary': '#f0f0ff',
        'text-secondary': '#8888aa',
        'text-muted': '#44445a',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'grid-pulse': 'gridPulse 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'count-up': 'countUp 0.5s ease-out forwards',
      },
      keyframes: {
        gridPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(91, 77, 255, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(91, 77, 255, 0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
