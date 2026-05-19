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
        /* ── Paleta principal — cálida ─────────────────── */

        /* Ámbar/dorado — color primario (ojos del búho) */
        primary: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",   /* ← main */
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        /* Crema cálido — backgrounds */
        cream: {
          50:  "#FFFEF9",
          100: "#FFFBEF",
          200: "#FFF8E6",
          300: "#FFF2CD",   /* ← color solicitado */
          400: "#FFE89A",
          500: "#FFD84D",
        },

        /* Marrón cálido — texto y profundidad */
        brown: {
          50:  "#FDF8F0",
          100: "#F5E6C8",
          500: "#92400E",
          600: "#7C2D12",
          700: "#431407",
          800: "#2D0D00",
          900: "#1C0800",
        },

        /* Naranja — CTAs */
        orange: {
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },

        /* Navy suave — solo detalles (lentes del búho) */
        navy: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E3A5F",
          900: "#0F172A",
        },

        /* Remap indigo → ámbar/primary para compatibilidad con código existente */
        indigo: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        violet: {
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
        },

        /* Emerald — sin cambios */
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
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

        /* Brand tokens */
        brand: {
          bg:     "#FFF8E6",
          warm:   "#FFF2CD",
          text:   "#1C0F00",
          muted:  "#92400E",
          border: "#F5DFA0",
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
        "elev-1": "0 1px 3px rgba(180,83,9,.07), 0 1px 2px rgba(180,83,9,.04)",
        "elev-2": "0 4px 12px rgba(180,83,9,.08), 0 2px 4px rgba(180,83,9,.05)",
        "elev-3": "0 10px 24px rgba(180,83,9,.10), 0 4px 8px rgba(180,83,9,.06)",
        "elev-4": "0 24px 48px rgba(180,83,9,.13), 0 10px 24px rgba(180,83,9,.07)",
        "glow-amber":  "0 0 40px rgba(217,119,6,0.40)",
        "glow-orange": "0 0 30px rgba(249,115,22,0.35)",
        "glow-emerald":"0 0 30px rgba(16,185,129,0.30)",
      },
      animation: {
        "fade-up":  "fadeUp 0.5s ease-out forwards",
        "fade-in":  "fadeIn 0.4s ease-out forwards",
        "float":    "floatY 4s ease-in-out infinite",
        "float-2":  "floatY2 5s ease-in-out infinite",
        "blob":     "blob 8s ease-in-out infinite",
        "shimmer":  "shimmer 1.4s infinite",
        "wiggle":   "wiggle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:  { from:{opacity:"0",transform:"translateY(24px)"}, to:{opacity:"1",transform:"translateY(0)"} },
        fadeIn:  { from:{opacity:"0"}, to:{opacity:"1"} },
        floatY:  { "0%,100%":{transform:"translateY(0px)"}, "50%":{transform:"translateY(-12px)"} },
        floatY2: { "0%,100%":{transform:"translateY(-6px)"}, "50%":{transform:"translateY(6px)"} },
        blob:    { "0%,100%":{borderRadius:"60% 40% 30% 70%/60% 30% 70% 40%"}, "50%":{borderRadius:"30% 60% 70% 40%/50% 60% 30% 60%"} },
        shimmer: { "0%":{backgroundPosition:"-200% 0"}, "100%":{backgroundPosition:"200% 0"} },
        wiggle:  { "0%,100%":{transform:"rotate(-4deg)"}, "50%":{transform:"rotate(4deg)"} },
      },
    },
  },
  plugins: [],
};

export default config;
