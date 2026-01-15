import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🎨 UI/UX Pro Max - Aurora UI + Glassmorphism Color System
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue
          light: '#60A5FA',
          dark: '#2563EB',
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Purple
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        accent: {
          DEFAULT: '#EC4899', // Pink
          light: '#F472B6',
          dark: '#DB2777',
        },
        cta: {
          DEFAULT: '#F97316', // Orange - High conversion
          light: '#FB923C',
          dark: '#EA580C',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        // Aurora 背景色
        aurora: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          cyan: '#06B6D4',
        },
        // Glassmorphism 专用
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
        },
        background: {
          DEFAULT: '#0F172A', // Dark slate
          card: 'rgba(255, 255, 255, 0.05)',
          light: '#F8FAFC',
        },
        text: {
          DEFAULT: '#FFFFFF', // White for dark bg
          secondary: '#E9D5FF', // Purple-100
          tertiary: '#C4B5FD', // Purple-300
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.2)',
        },
      },
      // 📝 UI/UX Pro Max - Typography: Plus Jakarta Sans (Friendly SaaS)
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 📱 Responsive breakpoints (mobile-first)
      screens: {
        'xs': '320px',  // Mobile small
        'sm': '640px',  // Mobile large
        'md': '768px',  // Tablet
        'lg': '1024px', // Desktop
        'xl': '1440px', // Desktop large
        '2xl': '1920px', // Desktop XL
      },
      // ✨ Micro-interactions: Subtle animations (50-100ms for hover)
      transitionDuration: {
        'micro': '75ms',   // Micro-interactions
        'fast': '150ms',   // Fast transitions
        'normal': '200ms', // Standard
        'slow': '300ms',   // Slow for larger movements
      },
      // 🎭 Animation keyframes for micro-interactions
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
