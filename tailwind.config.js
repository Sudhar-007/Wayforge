/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Canvas + node surfaces
        canvas: {
          bg: "#f8fafc", // slate-50
        },
        node: {
          bg: "#ffffff",
          border: "#e2e8f0", // slate-200
          section: "#1e293b", // slate-800 (section header surface)
        },
        // Learner status — single source of truth for status coloring.
        status: {
          notStarted: "#64748b", // slate-500 (neutral)
          inProgress: "#f59e0b", // amber-500
          completed: "#22c55e", // green-500
          skipped: "#94a3b8", // slate-400 (muted)
        },
        // Edge stroke colors by prerequisite type.
        edge: {
          required: "#475569", // slate-600
          optional: "#94a3b8", // slate-400
        },
      },
    },
  },
  plugins: [],
};
