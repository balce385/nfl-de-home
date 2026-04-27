import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0f1c',
        surface: '#131a2b',
        surface2: '#1e293b',
        primary: '#3b82f6',
        accent: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
        ink: '#f8fafc',
        mute: '#94a3b8',
        line: '#1f2a44',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s infinite',
        'ticker': 'ticker 40s linear infinite',
        'reveal': 'reveal 0.9s ease-out forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%': { boxShadow: '0 0 0 0 rgba(239,68,68,.6)' },
          '70%': { boxShadow: '0 0 0 12px rgba(239,68,68,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        reveal: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
