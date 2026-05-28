import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
          dark: "#0B132B",
          darkMuted: "#1C2541",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        brand: { DEFAULT: "#38bdf8", deep: "#0ea5e9" },
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(148, 163, 184, 0.28), 0 1px 2px 0 rgba(9, 9, 11, 0.16)",
        md: "0 10px 20px -10px rgba(148, 163, 184, 0.55), 0 8px 18px -8px rgba(9, 9, 11, 0.3)",
        xl: "0 22px 44px -20px rgba(148, 163, 184, 0.75), 0 24px 40px -24px rgba(9, 9, 11, 0.6)",
        glow: "0 0 0 1px rgba(56, 189, 248, 0.25), 0 0 26px rgba(56, 189, 248, 0.3)",
        "glow-soft": "0 0 0 1px rgba(56, 189, 248, 0.15), 0 0 18px rgba(56, 189, 248, 0.2)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
