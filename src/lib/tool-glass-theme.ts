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

/** Outer glass shell — reference: gray-900/40, blur-2xl, white/10 border, 24px radius */
export const TOOL_GLASS_SHELL_BASE =
  "rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-2xl";

/** Inner drop-zone box — no solid border; neon ring rendered in CSS */
export const TOOL_GLASS_DROPZONE_BASE =
  "tool-upload-zone-inner rounded-[20px] bg-black/20 backdrop-blur-[2px] transition-[box-shadow,background-color] duration-200";

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
      "rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-2xl ring-1 ring-red-500/10",
    badgeIcon: "text-neutral-500",
    cta: "rounded-lg border border-white/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(239,68,68,0.15)]",
    ctaHover: "hover:border-white hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]",
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
      "rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-2xl ring-1 ring-emerald-500/10",
    badgeIcon: "text-neutral-500",
    cta: "rounded-lg border border-white/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white",
    ctaHover: "hover:border-white hover:bg-white/[0.04]",
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
      "rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-2xl ring-1 ring-orange-500/10",
    badgeIcon: "text-neutral-500",
    cta: "rounded-lg border border-white/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white",
    ctaHover: "hover:border-white hover:bg-white/[0.04]",
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
      "rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-2xl ring-1 ring-violet-500/10",
    badgeIcon: "text-neutral-500",
    cta: "rounded-lg border border-white/80 bg-transparent px-6 py-2.5 text-sm font-semibold text-white",
    ctaHover: "hover:border-white hover:bg-white/[0.04]",
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
