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
        indigo: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        brand: {
          bg:      "#F5F3FF",
          text:    "#1E1B4B",
          muted:   "#6B7280",
          border:  "#E0E7FF",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        sans:    ["Plus Jakarta Sans", "sans-serif"],
        mono:    ["Fira Code", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "elev-1": "0 1px 3px rgba(99,102,241,.08), 0 1px 2px rgba(99,102,241,.04)",
        "elev-2": "0 4px 12px rgba(99,102,241,.08), 0 2px 4px rgba(99,102,241,.05)",
        "elev-3": "0 10px 24px rgba(99,102,241,.10), 0 4px 8px rgba(99,102,241,.06)",
        "elev-4": "0 24px 48px rgba(99,102,241,.12), 0 10px 24px rgba(99,102,241,.07)",
        "glow-indigo": "0 0 40px rgba(99,102,241,0.35)",
        "glow-emerald": "0 0 30px rgba(16,185,129,0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-hero": `radial-gradient(ellipse 80% 60% at 20% 40%, rgba(99,102,241,0.35) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 50% at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 55%),
                      linear-gradient(135deg, #0F0C29 0%, #1a1744 40%, #1E1B4B 100%)`,
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease-out forwards",
        "fade-in":   "fadeIn 0.4s ease-out forwards",
        "float":     "floatY 4s ease-in-out infinite",
        "float-2":   "floatY2 5s ease-in-out infinite",
        "blob":      "blob 8s ease-in-out infinite",
        "shimmer":   "shimmer 1.4s infinite",
        "pulse-ring":"pulse-ring 1.5s ease-out infinite",
      },
      keyframes: {
        fadeUp:    { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        floatY:    { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
        floatY2:   { "0%,100%": { transform: "translateY(-6px)" }, "50%": { transform: "translateY(6px)" } },
        blob:      { "0%,100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }, "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
      },
    },
  },
  plugins: [],
};

export default config;
