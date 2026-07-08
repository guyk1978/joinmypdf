import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "0",
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
          dark: "var(--im-surface-card)",
          darkMuted: "var(--im-surface-card-hover)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        brand: { DEFAULT: "#525252", deep: "#171717" },
        matte: {
          bg: "var(--im-bg-page)",
          panel: "var(--im-surface-card)",
          border: "var(--im-border)",
          text: "var(--im-text)",
          muted: "var(--im-text-subtle)",
        },
        im: {
          accent: "var(--im-accent)",
          "accent-strong": "var(--im-accent-strong)",
          surface: "var(--im-surface-card)",
          "surface-hover": "var(--im-surface-card-hover)",
          panel: "var(--im-surface-panel)",
          border: "var(--im-border)",
          "border-strong": "var(--im-border-strong)",
          text: "var(--im-text)",
          muted: "var(--im-text-muted)",
          subtle: "var(--im-text-subtle)",
          marketing: "var(--im-marketing-bg)",
        },
      },
      spacing: {
        "im-card": "var(--im-padding-card)",
        "im-panel": "var(--im-padding-panel)",
        "im-cta": "var(--im-padding-cta)",
      },
      fontSize: {
        "im-card": ["var(--im-font-card-label)", { lineHeight: "var(--im-leading-tight)", fontWeight: "600" }],
        "im-body-sm": ["var(--im-font-body-sm)", { lineHeight: "var(--im-leading-body)" }],
        "im-lead": ["var(--im-font-lead)", { lineHeight: "var(--im-leading-snug)", fontWeight: "600" }],
        "im-section": ["var(--im-font-section)", { lineHeight: "1.15", fontWeight: "800" }],
      },
      borderWidth: {
        im: "var(--im-border-width)",
        "im-accent": "var(--im-border-width-accent)",
        "im-cta": "var(--im-border-width-cta)",
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        glow: "none",
        "glow-soft": "none",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica Neue", "Helvetica", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        trace: {
          "0%": { borderColor: "transparent" },
          "50%": { borderColor: "#60a5fa" },
          "100%": { borderColor: "transparent" },
        },
      },
      animation: {
        "trace-border": "trace 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
