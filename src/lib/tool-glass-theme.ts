/** Category slugs from tools.json — drives flat modular tool page panels. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** RGB triplet for accent bar and CTA highlights */
  accentRgb: string;
  /** @deprecated Use accentRgb — kept for CSS var compatibility */
  glowRgb: string;
  /** Upper upload shell — industrial glass workspace panel */
  shell: string;
  /** Inner drop-zone — minimalist dashed glass frame */
  dropzone: string;
  dropzoneActive: string;
  dropzoneHover: string;
  /** Post-upload / settings panels */
  panel: string;
  /** Choose-files CTA */
  cta: string;
  ctaHover: string;
};

export const TOOL_UPLOAD_SHELL =
  "tool-upload-upper-panel overflow-hidden rounded-2xl border border-neutral-200 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

export const TOOL_GLASS_DROPZONE_BASE =
  "tool-upload-zone-inner rounded-xl border border-dashed border-neutral-300 bg-neutral-50/40 transition-all duration-300 dark:border-neutral-800 dark:bg-white/[0.02]";

export const TOOL_GLASS_DROPZONE_HOVER =
  "hover:border-neutral-400 hover:bg-white/60 dark:hover:border-neutral-600 dark:hover:bg-white/[0.04] dark:hover:shadow-[0_0_32px_rgba(var(--tool-accent-rgb),0.14)]";

const CTA_BASE =
  "tool-upload-cta rounded-xl border border-[rgba(var(--tool-accent-rgb),0.45)] bg-[rgba(var(--tool-accent-rgb),0.1)] px-8 py-3 text-sm font-bold tracking-wide text-neutral-900 shadow-[0_0_20px_rgba(var(--tool-accent-rgb),0.18),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm dark:text-white";

const CTA_HOVER =
  "hover:border-[rgba(var(--tool-accent-rgb),0.7)] hover:bg-[rgba(var(--tool-accent-rgb),0.18)] hover:shadow-[0_0_32px_rgba(var(--tool-accent-rgb),0.32),inset_0_1px_0_rgba(255,255,255,0.16)]";

const TOOL_GLASS_PANEL =
  "rounded-xl border border-neutral-200 bg-white/70 p-5 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    accentRgb: "239, 68, 68",
    glowRgb: "239, 68, 68",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive:
      "tool-upload-zone--active !border-[rgba(var(--tool-accent-rgb),0.55)] !bg-[rgba(var(--tool-accent-rgb),0.06)] shadow-[0_0_36px_rgba(var(--tool-accent-rgb),0.22)]",
    dropzoneHover: TOOL_GLASS_DROPZONE_HOVER,
    panel: TOOL_GLASS_PANEL,
    cta: CTA_BASE,
    ctaHover: CTA_HOVER,
  },
  edit: {
    id: "edit",
    label: "Edit",
    accentRgb: "16, 185, 129",
    glowRgb: "16, 185, 129",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive:
      "tool-upload-zone--active !border-[rgba(var(--tool-accent-rgb),0.55)] !bg-[rgba(var(--tool-accent-rgb),0.06)] shadow-[0_0_36px_rgba(var(--tool-accent-rgb),0.22)]",
    dropzoneHover: TOOL_GLASS_DROPZONE_HOVER,
    panel: TOOL_GLASS_PANEL,
    cta: CTA_BASE,
    ctaHover: CTA_HOVER,
  },
  optimize: {
    id: "optimize",
    label: "Optimize",
    accentRgb: "249, 115, 22",
    glowRgb: "249, 115, 22",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive:
      "tool-upload-zone--active !border-[rgba(var(--tool-accent-rgb),0.55)] !bg-[rgba(var(--tool-accent-rgb),0.06)] shadow-[0_0_36px_rgba(var(--tool-accent-rgb),0.22)]",
    dropzoneHover: TOOL_GLASS_DROPZONE_HOVER,
    panel: TOOL_GLASS_PANEL,
    cta: CTA_BASE,
    ctaHover: CTA_HOVER,
  },
  security: {
    id: "security",
    label: "Security",
    accentRgb: "139, 92, 246",
    glowRgb: "139, 92, 246",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive:
      "tool-upload-zone--active !border-[rgba(var(--tool-accent-rgb),0.55)] !bg-[rgba(var(--tool-accent-rgb),0.06)] shadow-[0_0_36px_rgba(var(--tool-accent-rgb),0.22)]",
    dropzoneHover: TOOL_GLASS_DROPZONE_HOVER,
    panel: TOOL_GLASS_PANEL,
    cta: CTA_BASE,
    ctaHover: CTA_HOVER,
  },
};

export function normalizeToolGlassCategory(category?: string | null): ToolGlassCategory {
  if (category === "convert" || category === "edit" || category === "optimize" || category === "security") {
    return category;
  }
  return "edit";
}

export function getToolGlassTheme(category?: string | null): ToolGlassTheme {
  return TOOL_GLASS_THEME[normalizeToolGlassCategory(category)];
}
