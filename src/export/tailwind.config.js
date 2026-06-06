/**
 * Wayforge — Tailwind config mapping for the design system.
 * --------------------------------------------------------------------------
 * Single source of truth = `wayforge.tokens.css` (CSS variables, light + dark).
 * Import that stylesheet once globally (e.g. in src/index.css):
 *
 *     @import "./wayforge.tokens.css";
 *
 * Semantic tokens below resolve to `var(--token)` so every utility
 * (bg-surface, text-2, border-default, bg-accent, …) automatically flips
 * between light and dark when you set `data-theme="dark"` on <html>.
 *
 * Static ramps (green-*, neutral-*) are emitted as literal hex so you also get
 * the full numeric scale as utilities (bg-green-600, text-neutral-500, …).
 *
 * Drop-in replacement for your current tailwind.config.js `theme.extend`.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---- single accent (flips per theme) ---- */
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          on: 'var(--accent-on)',
        },

        /* ---- semantic surfaces / text / borders (flip per theme) ---- */
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
          4: 'var(--text-4)',
        },

        /* ---- roadmap canvas / nodes ---- */
        canvas: { dot: 'var(--canvas-dot)' },
        node: { surface: 'var(--node-surface)', border: 'var(--node-border)' },
        section: { surface: 'var(--section-surface)', text: 'var(--section-text)' },

        /* ---- node status (single source of truth) ---- */
        status: {
          'not-started': 'var(--status-not)',
          'in-progress': 'var(--status-prog)',
          completed: 'var(--status-done)',
          skipped: 'var(--status-skip)',
        },
        edge: { required: 'var(--edge-required)', optional: 'var(--edge-optional)' },

        /* ---- static green ramp (the accent, full scale) ---- */
        green: {
          50: '#ecfdf3', 100: '#d3f8e0', 200: '#a6f0c2', 300: '#6fe3a0', 400: '#34cf7e',
          500: '#14b368', 600: '#0a9457', 700: '#097a49', 800: '#0a603b', 900: '#094f32',
        },

        /* ---- static neutral ramp (charcoal → white) ---- */
        neutral: {
          0: '#ffffff', 25: '#fcfcfd', 50: '#f7f8f9', 100: '#eef0f2', 200: '#e3e6e9',
          300: '#cdd2d7', 400: '#9aa2aa', 500: '#6c757e', 600: '#4d555c', 700: '#383e44',
          800: '#24282d', 900: '#16191c', 950: '#0d0f11',
        },
      },

      fontFamily: {
        display: ['Schibsted Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Hanken Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'monospace'],
      },

      /* type scale → [size, { lineHeight, letterSpacing }] */
      fontSize: {
        display: ['60px', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1: ['40px', { lineHeight: '1.06', letterSpacing: '-0.025em' }],
        h2: ['28px', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        h3: ['20px', { lineHeight: '1.25', letterSpacing: '-0.012em' }],
        lg: ['17px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.55' }],
        sm: ['13.5px', { lineHeight: '1.5' }],
        xs: ['12px', { lineHeight: '1.4' }],
        eyebrow: ['11.5px', { lineHeight: '1.4', letterSpacing: '0.14em' }],
      },

      /* 4px spacing grid (extends Tailwind's defaults with named steps) */
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
        8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px',
      },

      borderRadius: {
        sm: '7px', md: '11px', lg: '16px', xl: '22px', pill: '999px',
      },

      boxShadow: {
        sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)',
      },

      transitionTimingFunction: { brand: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
    },
  },
  plugins: [],
};
