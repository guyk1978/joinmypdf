/** Category slugs from tools.json — drives flat modular tool page panels. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** RGB triplet for accent bar and CTA highlights */
  accentRgb: string;
  /** @deprecated Use accentRgb — kept for CSS var compatibility */
  glowRgb: string;
  /** Select-files button background */
  ctaBg: string;
  /** Select-files button hover background */
  ctaBgHover: string;
  /** Upper upload shell — transparent, no container box */
  shell: string;
  /** Inner drop-zone — invisible frame; interaction only */
  dropzone: string;
  dropzoneActive: string;
  dropzoneHover: string;
  /** Post-upload / settings panels */
  panel: string;
  /** Choose-files CTA */
  cta: string;
  ctaHover: string;
};

/** No visible outer panel — content floats on page background */
export const TOOL_UPLOAD_SHELL = "tool-upload-shell w-full";

/** Drop zone — no border, background, or shadow */
export const TOOL_GLASS_DROPZONE_BASE = "tool-upload-zone-base border-0 bg-transparent shadow-none";

export const TOOL_GLASS_DROPZONE_HOVER = "";

const CTA_BASE =
  "tool-upload-cta tool-upload-zone__cta-shell px-6 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-white transition-colors";

const CTA_HOVER = "";

const TOOL_GLASS_PANEL =
  "rounded-none bg-transparent p-5 shadow-[var(--surface-elevate)] dark:bg-transparent";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    accentRgb: "239, 68, 68",
    glowRgb: "239, 68, 68",
    ctaBg: "#2D7FF9",
    ctaBgHover: "#1A6FE8",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
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
    ctaBg: "#2D7FF9",
    ctaBgHover: "#1A6FE8",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
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
    ctaBg: "#2D7FF9",
    ctaBgHover: "#1A6FE8",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
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
    ctaBg: "#2D7FF9",
    ctaBgHover: "#1A6FE8",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
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
