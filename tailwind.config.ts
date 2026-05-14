import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b1220",
          muted: "#101b33",
        },
        ink: { DEFAULT: "#e5e7eb", muted: "#9ca3af" },
        brand: { DEFAULT: "#38bdf8", deep: "#0ea5e9" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
