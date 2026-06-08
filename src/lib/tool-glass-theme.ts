/** Category slugs from tools.json — drives neon-accented dark glassmorphism. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** RGB triplet for CSS `--tool-glow-rgb` neon frame */
  glowRgb: string;
  /** Outer glass card — semi-transparent shell with blur */
  shell: string;
  /** Inner drop-zone — layout classes; glow via CSS using glowRgb */
  dropzone: string;
  dropzoneActive: string;
  dropzoneHover: string;
  /** Post-upload / settings panels */
  panel: string;
  /** Privacy badge icon tint */
  badgeIcon: string;
  /** Choose-files CTA */
  cta: string;
  ctaHover: string;
};

/** Outer glass shell — light glass + dark glass variants */
export const TOOL_GLASS_SHELL_BASE =
  "rounded-[20px] border border-neutral-200 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none dark:backdrop-blur-2xl";

/** Inner drop-zone — neon ring rendered in CSS on .tool-upload-zone */
export const TOOL_GLASS_DROPZONE_BASE =
  "tool-upload-zone-inner rounded-[16px] bg-black/[0.03] backdrop-blur-[2px] transition-[box-shadow,background-color] duration-200 dark:bg-black/20";

const CTA_BASE =
  "rounded-lg border bg-transparent px-6 py-2.5 text-sm font-semibold border-neutral-400 text-neutral-900 dark:border-white/80 dark:text-white";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    glowRgb: "239, 68, 68",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
    dropzoneHover: "",
    panel:
      "rounded-[20px] border border-neutral-200 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none dark:backdrop-blur-2xl ring-1 ring-red-500/10",
    badgeIcon: "text-neutral-500",
    cta: `${CTA_BASE} dark:shadow-[0_0_15px_rgba(239,68,68,0.3)]`,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-50 dark:hover:border-white dark:hover:bg-white/[0.04] dark:hover:shadow-[0_0_20px_rgba(239,68,68,0.35)]",
  },
  edit: {
    id: "edit",
    label: "Edit",
    glowRgb: "16, 185, 129",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
    dropzoneHover: "",
    panel:
      "rounded-[20px] border border-neutral-200 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none dark:backdrop-blur-2xl ring-1 ring-emerald-500/10",
    badgeIcon: "text-neutral-500",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-50 dark:hover:border-white dark:hover:bg-white/[0.04]",
  },
  optimize: {
    id: "optimize",
    label: "Optimize",
    glowRgb: "249, 115, 22",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
    dropzoneHover: "",
    panel:
      "rounded-[20px] border border-neutral-200 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none dark:backdrop-blur-2xl ring-1 ring-orange-500/10",
    badgeIcon: "text-neutral-500",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-50 dark:hover:border-white dark:hover:bg-white/[0.04]",
  },
  security: {
    id: "security",
    label: "Security",
    glowRgb: "139, 92, 246",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone: TOOL_GLASS_DROPZONE_BASE,
    dropzoneActive: "tool-upload-zone--active",
    dropzoneHover: "",
    panel:
      "rounded-[20px] border border-neutral-200 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-gray-900/40 dark:shadow-none dark:backdrop-blur-2xl ring-1 ring-violet-500/10",
    badgeIcon: "text-neutral-500",
    cta: CTA_BASE,
    ctaHover: "hover:border-neutral-600 hover:bg-neutral-50 dark:hover:border-white dark:hover:bg-white/[0.04]",
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
