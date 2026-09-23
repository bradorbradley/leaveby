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
        coral: { DEFAULT: "var(--coral)", soft: "var(--coral-soft)", pale: "var(--coral-pale)" },
        mustard: { DEFAULT: "var(--mustard)", soft: "var(--mustard-soft)" },
        sage: { DEFAULT: "var(--sage)", soft: "var(--sage-soft)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(31,32,48,0.04), 0 18px 40px -24px rgba(31,32,48,0.28)",
        cta: "0 16px 34px -16px rgba(31,32,48,0.55)",
        sheet: "0 -24px 60px -24px rgba(31,32,48,0.35)",
        pop: "0 12px 32px -12px rgba(31,32,48,0.35)",
      },
      borderRadius: {
        xl2: "20px",
        xl3: "28px",
      },
    },
  },
  plugins: [],
};

export default config;
