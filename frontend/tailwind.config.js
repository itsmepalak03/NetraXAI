/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#0B1020",
        indigo: "#171B3A",
        softbg: "#F5F7FA",
        ptext: "#151827",
        stext: "#667085",

        // Landing - Midnight AI
        teal: { DEFAULT: "#22D3C5" },
        violet: { DEFAULT: "#7C5CFC" },
        lavender: "#B8A8FF",

        // Dashboard - Clinical Command Centre
        dashbg: "#F7F8FC",
        dashnavy: "#111827",
        dashteal: "#16B8A6",
        dashslate: "#64748B",

        // Screening - Clinical Precision
        screenteal: "#0F766E",
        screencyan: "#06B6D4",

        // Quality - Diagnostic Green
        emerald: "#10B981",
        qgreen: "#22C55E",
        qamber: "#F59E0B",
        qred: "#EF4444",

        // Retinal analysis - Medical Imaging
        graphite: "#111827",
        imgcyan: "#22D3EE",
        imgsky: "#38BDF8",
        imgviolet: "#8B5CF6",

        // XAI - AI Intelligence
        xaipurple: "#4C1D95",
        xaiviolet: "#7C3AED",
        xaimagenta: "#DB2777",
        xaipink: "#F472B6",

        // Doctor review - Human + AI
        revnavy: "#1E293B",
        revteal: "#14B8A6",
        revblue: "#3B82F6",
        revgold: "#EAB308",

        // Rural simulator - Mission Control
        simnavy: "#0B1020",
        simblue: "#1E3A8A",
        simcyan: "#22D3EE",
        simlime: "#84CC16",
        simamber: "#F59E0B",
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        elevated: "0 4px 12px rgba(16,24,40,0.10)",
      },
      keyframes: {
        pulseSlow: { '0%,100%': { opacity: 0.5 }, '50%': { opacity: 1 } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        pulseSlow: 'pulseSlow 3s ease-in-out infinite',
        scan: 'scan 2.4s linear infinite',
      }
    },
  },
  plugins: [],
}
