/** Category slugs from tools.json — drives flat modular tool page panels. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** RGB triplet for accent bar and CTA highlights */
  accentRgb: string;
  /** @deprecated Use accentRgb — kept for CSS var compatibility */
  glowRgb: string;
  /** Upper upload shell — flat neutral panel */
  shell: string;
  /** Inner drop-zone — minimalist dashed frame */
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
  "tool-upload-upper-panel rounded-none border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";

export const TOOL_GLASS_DROPZONE_BASE =
  "tool-upload-zone-inner rounded-none border border-dashed border-neutral-300 bg-neutral-50 transition-colors duration-150 dark:border-neutral-700 dark:bg-neutral-950/60";

const CTA_BASE =
  "rounded-md border border-neutral-400 bg-transparent px-6 py-2.5 text-sm font-semibold text-neutral-900 dark:border-neutral-500 dark:text-neutral-100";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    accentRgb: "239, 68, 68",
    glowRgb: "239, 68, 68",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active border-neutral-400 dark:border-neutral-500",
    dropzoneHover: "",
    panel: "rounded-none border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/80",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-100 dark:hover:border-neutral-400 dark:hover:bg-neutral-800",
  },
  edit: {
    id: "edit",
    label: "Edit",
    accentRgb: "16, 185, 129",
    glowRgb: "16, 185, 129",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active border-neutral-400 dark:border-neutral-500",
    dropzoneHover: "",
    panel: "rounded-none border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/80",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-100 dark:hover:border-neutral-400 dark:hover:bg-neutral-800",
  },
  optimize: {
    id: "optimize",
    label: "Optimize",
    accentRgb: "249, 115, 22",
    glowRgb: "249, 115, 22",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active border-neutral-400 dark:border-neutral-500",
    dropzoneHover: "",
    panel: "rounded-none border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/80",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-100 dark:hover:border-neutral-400 dark:hover:bg-neutral-800",
  },
  security: {
    id: "security",
    label: "Security",
    accentRgb: "139, 92, 246",
    glowRgb: "139, 92, 246",
    shell: TOOL_UPLOAD_SHELL,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active border-neutral-400 dark:border-neutral-500",
    dropzoneHover: "",
    panel: "rounded-none border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/80",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-100 dark:hover:border-neutral-400 dark:hover:bg-neutral-800",
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
