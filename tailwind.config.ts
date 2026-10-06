import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF1F6", 100: "#FFE0EC", 200: "#FFC2D9", 300: "#FF94BC", 400: "#F0589A",
          500: "#D6247C", 600: "#B81A68", 700: "#951556", 800: "#6F1040", 900: "#4A0B2B",
        },
        ink: "#1D1519",
        muted: "#6B6168",
        line: "#EBE4E7",
        surface: "#FDFAFB",
        blush: "#FBEFF3",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(74,11,43,0.04), 0 4px 16px rgba(74,11,43,0.05)",
        lift: "0 8px 30px rgba(74,11,43,0.10)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { pop: "pop .35s ease", slideUp: ".25s ease-out", shimmer: "shimmer 1.4s infinite" },
    },
  },
  plugins: [],
} satisfies Config;
