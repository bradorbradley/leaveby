import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "var(--ground)",
        paper: "var(--paper)",
        ink: { DEFAULT: "var(--ink)", 2: "var(--ink-2)", 3: "var(--ink-3)" },
        line: "var(--line)",
        lilac: { DEFAULT: "var(--lilac)", deep: "var(--lilac-deep)" },
        blush: { DEFAULT: "var(--blush)", deep: "var(--blush-deep)" },
        sage: { DEFAULT: "var(--sage)", deep: "var(--sage-deep)" },
        butter: { DEFAULT: "var(--butter)", deep: "var(--butter-deep)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        cta: "0 12px 28px -12px rgba(126, 95, 208, 0.7)",
        sheet: "0 -20px 60px -20px rgba(46, 37, 64, 0.35)",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%": { transform: "translateY(-8px) rotate(4deg)" },
        },
        breathe: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.18)" } },
        pulse2: { "0%, 100%": { transform: "scale(1)", opacity: "1" }, "50%": { transform: "scale(1.6)", opacity: "0.5" } },
        twinkle: { "0%, 100%": { transform: "scale(0.8)", opacity: "0.5" }, "50%": { transform: "scale(1.15)", opacity: "1" } },
      },
      animation: {
        bob: "bob 5s ease-in-out infinite",
        breathe: "breathe 2.4s ease-in-out infinite",
        pulse2: "pulse2 1s ease-in-out infinite",
        twinkle: "twinkle 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
