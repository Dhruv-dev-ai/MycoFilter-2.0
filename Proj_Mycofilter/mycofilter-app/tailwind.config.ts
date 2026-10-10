import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand greens
        forest: {
          50:  '#f0f7f0',
          100: '#dceddc',
          200: '#bbdabc',
          300: '#8fc090',
          400: '#60a062',
          500: '#3d7d3f',
          600: '#2d6330',
          700: '#244f27',
          800: '#1e3f20',
          900: '#19341b',
          950: '#0c1d0d',
        },
        teal: {
          50:  '#effefb',
          100: '#c8fef5',
          200: '#92faec',
          300: '#54f1e0',
          400: '#23e0cf',
          500: '#0bbdb6',
          600: '#089895',
          700: '#0b7a79',
          800: '#0f6062',
          900: '#114f51',
          950: '#032e30',
        },
        slate: {
          850: '#1a2130',
        },
        // Status colors
        ok:      '#22c55e',
        warn:    '#f59e0b',
        alert:   '#ef4444',
        info:    '#3b82f6',
        neutral: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(61,125,63,0.25)',
        'glow-teal':  '0 0 20px rgba(11,189,182,0.20)',
        'card':       '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-up':       'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow':     'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':      'spin 3s linear infinite',
        'float':          'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' },                         to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      backgroundImage: {
        'gradient-radial':     'radial-gradient(var(--tw-gradient-stops))',
        'myco-texture':        "url('/textures/mycelium-bg.svg')",
      },
    },
  },
  plugins: [],
}

export default config
