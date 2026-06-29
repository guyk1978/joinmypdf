/**
 * Industrial Matte design system — token names for TS/Tailwind reference.
 * Source of truth for values: src/styles/industrial-matte-tokens.css
 */

export const imColors = {
  accent: "var(--im-accent)",
  accentStrong: "var(--im-accent-strong)",
  surfaceCard: "var(--im-surface-card)",
  surfacePanel: "var(--im-surface-panel)",
  text: "var(--im-text)",
  textMuted: "var(--im-text-muted)",
  marketingBg: "var(--im-marketing-bg)",
} as const;

export const imTypography = {
  cardLabel: "text-[length:var(--im-font-card-label)] font-semibold leading-[var(--im-leading-tight)]",
  bodySm: "text-[length:var(--im-font-body-sm)] leading-[var(--im-leading-body)]",
  lead: "text-[length:var(--im-font-lead)] font-semibold leading-[var(--im-leading-snug)]",
  cta: "text-[length:var(--im-font-body-sm)] font-bold tracking-[var(--im-tracking-tight)]",
} as const;

export const imCardAccent =
  "im-card-accent focus-visible:outline-none";

export const imCardSurface =
  "im-card-surface";

export const imPanelExpanded = "im-panel-expanded";

export const imBtnCta = "im-btn-cta";
