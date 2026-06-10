/** @type {import('tailwindcss').Config} */
export default {
  // Theme flips on <html data-theme="dark">; the `dark:` variant works too.
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ---- single accent (flips per theme) ----
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          on: "var(--accent-on)",
        },

        // ---- ink: primary-action charcoal (flips to paper in dark) ----
        ink: {
          DEFAULT: "var(--ink)",
          hover: "var(--ink-hover)",
          on: "var(--ink-on)",
        },

        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },

        // ---- semantic surfaces / text / borders (flip per theme) ----
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          4: "var(--text-4)",
        },

        // ---- roadmap canvas / nodes ----
        canvas: { dot: "var(--canvas-dot)" },
        node: { surface: "var(--node-surface)", border: "var(--node-border)" },
        section: {
          surface: "var(--section-surface)",
          text: "var(--section-text)",
        },

        // ---- node status (single source of truth; see src/lib/statusStyles.ts) ----
        status: {
          "not-started": "var(--status-not)",
          "in-progress": "var(--status-prog)",
          "in-progress-soft": "var(--status-prog-soft)",
          completed: "var(--status-done)",
          "completed-soft": "var(--status-done-soft)",
          skipped: "var(--status-skip)",
        },
        edge: {
          required: "var(--edge-required)",
          optional: "var(--edge-optional)",
        },

        // ---- static green ramp (deep desaturated viridian) ----
        green: {
          50: "#f0f7f2",
          100: "#dcefe3",
          200: "#bfe3cd",
          300: "#93cfac",
          400: "#5fb285",
          500: "#3d9568",
          600: "#2a7d54",
          700: "#236546",
          800: "#1d503a",
          900: "#173f2f",
        },

        // ---- static neutral ramp (warm paper → ink) ----
        neutral: {
          0: "#ffffff",
          25: "#fbfbf9",
          50: "#f6f5f2",
          100: "#edece7",
          200: "#e0dfd9",
          300: "#c9c8c1",
          400: "#98978f",
          500: "#6e6d66",
          600: "#504f49",
          700: "#3a3935",
          800: "#262522",
          900: "#181816",
          950: "#0f0f0d",
        },
      },

      fontFamily: {
        display: ["Cabinet Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Switzer", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SF Mono", "monospace"],
      },

      // type scale → [size, { lineHeight, letterSpacing }] — restrained on purpose
      fontSize: {
        display: ["44px", { lineHeight: "1.06", letterSpacing: "-0.022em", fontWeight: "800" }],
        h1: ["30px", { lineHeight: "1.15", letterSpacing: "-0.018em" }],
        h2: ["23px", { lineHeight: "1.2", letterSpacing: "-0.014em" }],
        h3: ["18px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        lg: ["16px", { lineHeight: "1.55" }],
        base: ["14.5px", { lineHeight: "1.6" }],
        sm: ["13px", { lineHeight: "1.5" }],
        xs: ["11.5px", { lineHeight: "1.4" }],
        eyebrow: ["10.5px", { lineHeight: "1.4", letterSpacing: "0.18em" }],
      },

      // 4px spacing grid (matches Tailwind's default steps; named for clarity)
      spacing: {
        1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px",
        8: "32px", 10: "40px", 12: "48px", 16: "64px", 20: "80px", 24: "96px",
      },

      borderRadius: {
        sm: "4px", md: "6px", lg: "10px", xl: "14px", pill: "999px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)",
      },

      transitionTimingFunction: { brand: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    },
  },
  plugins: [],
};
