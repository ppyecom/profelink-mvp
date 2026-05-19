import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Warm cream palette */
        cream: {
          50:  "#FFFDF5",
          100: "#FFF8E8",
          200: "#FFF2CD",
          300: "#FFE89A",
          400: "#FFD84D",
        },
        /* Navy blue — lentes del búho */
        navy: {
          50:  "#EBF4FF",
          100: "#C3DFFE",
          300: "#6BAED6",
          500: "#2B6CB0",
          600: "#1B4F8A",
          700: "#0F2F6B",
          800: "#0A1F4E",
          900: "#071540",
        },
        /* Re-mapear indigo → navy para compatibilidad */
        indigo: {
          50:  "#EBF4FF",
          100: "#C3DFFE",
          200: "#A8D0F5",
          300: "#6BAED6",
          400: "#4D9FD4",
          500: "#2B6CB0",
          600: "#1B4F8A",
          700: "#0F2F6B",
          800: "#0A1F4E",
          900: "#071540",
        },
        violet: {
          400: "#F59E0B",
          500: "#D97706",
          600: "#B45309",
        },
        amber: {
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        orange: {
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
        },
        brand: {
          bg:     "#FFF8E8",
          warm:   "#FFF2CD",
          text:   "#1A2744",
          muted:  "#64748B",
          border: "#F0D89A",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        sans:    ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "elev-1": "0 1px 3px rgba(15,47,107,.07), 0 1px 2px rgba(15,47,107,.04)",
        "elev-2": "0 4px 12px rgba(15,47,107,.08), 0 2px 4px rgba(15,47,107,.05)",
        "elev-3": "0 10px 24px rgba(15,47,107,.10), 0 4px 8px rgba(15,47,107,.06)",
        "elev-4": "0 24px 48px rgba(15,47,107,.12), 0 10px 24px rgba(15,47,107,.07)",
        "glow-navy":   "0 0 40px rgba(43,108,176,0.35)",
        "glow-amber":  "0 0 30px rgba(245,158,11,0.40)",
        "glow-emerald":"0 0 30px rgba(16,185,129,0.30)",
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease-out forwards",
        "fade-in":   "fadeIn 0.4s ease-out forwards",
        "float":     "floatY 4s ease-in-out infinite",
        "float-2":   "floatY2 5s ease-in-out infinite",
        "blob":      "blob 8s ease-in-out infinite",
        "shimmer":   "shimmer 1.4s infinite",
        "wiggle":    "wiggle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:  { from:{opacity:"0",transform:"translateY(24px)"}, to:{opacity:"1",transform:"translateY(0)"} },
        fadeIn:  { from:{opacity:"0"}, to:{opacity:"1"} },
        floatY:  { "0%,100%":{transform:"translateY(0px)"}, "50%":{transform:"translateY(-12px)"} },
        floatY2: { "0%,100%":{transform:"translateY(-6px)"}, "50%":{transform:"translateY(6px)"} },
        blob:    { "0%,100%":{borderRadius:"60% 40% 30% 70% / 60% 30% 70% 40%"}, "50%":{borderRadius:"30% 60% 70% 40% / 50% 60% 30% 60%"} },
        shimmer: { "0%":{backgroundPosition:"-200% 0"}, "100%":{backgroundPosition:"200% 0"} },
        wiggle:  { "0%,100%":{transform:"rotate(-3deg)"}, "50%":{transform:"rotate(3deg)"} },
      },
    },
  },
  plugins: [],
};

export default config;
