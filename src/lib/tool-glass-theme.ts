/** Category slugs from tools.json — drives neon-accented dark glassmorphism. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** Outer glass card — shared shape, category-tinted border */
  shell: string;
  /** Inner drop-zone neon ring + glow */
  dropzone: string;
  dropzoneActive: string;
  dropzoneHover: string;
  /** Post-upload / settings panels */
  panel: string;
  /** Privacy badge icon tint */
  badgeIcon: string;
  /** Choose-files CTA with neon glow border */
  cta: string;
  ctaHover: string;
};

/** Shared outer container — matches reference: rounded 20px, blur-xl, neutral-900/50 */
export const TOOL_GLASS_SHELL_BASE =
  "rounded-[20px] border border-white/10 bg-neutral-900/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)]";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone:
      "rounded-[16px] border border-red-500/70 bg-neutral-950/40 ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.35)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200",
    dropzoneActive:
      "border-red-400/90 ring-red-400/70 shadow-[0_0_28px_rgba(239,68,68,0.5)]",
    dropzoneHover: "group-hover:border-red-500/80 group-hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]",
    panel:
      "rounded-[20px] border border-white/10 bg-neutral-900/50 backdrop-blur-xl ring-1 ring-red-500/10",
    badgeIcon: "text-neutral-400",
    cta: "rounded-lg border border-white/90 bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] ring-1 ring-red-500/45",
    ctaHover: "hover:border-white hover:shadow-[0_0_24px_rgba(239,68,68,0.45)]",
  },
  edit: {
    id: "edit",
    label: "Edit",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone:
      "rounded-[16px] border border-emerald-500/70 bg-neutral-950/40 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200",
    dropzoneActive:
      "border-emerald-400/90 ring-emerald-400/70 shadow-[0_0_28px_rgba(16,185,129,0.5)]",
    dropzoneHover: "group-hover:border-emerald-500/80 group-hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]",
    panel:
      "rounded-[20px] border border-white/10 bg-neutral-900/50 backdrop-blur-xl ring-1 ring-emerald-500/10",
    badgeIcon: "text-neutral-400",
    cta: "rounded-lg border border-white/90 bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/45",
    ctaHover: "hover:border-white hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]",
  },
  optimize: {
    id: "optimize",
    label: "Optimize",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone:
      "rounded-[16px] border border-amber-500/70 bg-neutral-950/40 ring-1 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200",
    dropzoneActive:
      "border-amber-400/90 ring-amber-400/70 shadow-[0_0_28px_rgba(245,158,11,0.5)]",
    dropzoneHover: "group-hover:border-amber-500/80 group-hover:shadow-[0_0_24px_rgba(245,158,11,0.4)]",
    panel:
      "rounded-[20px] border border-white/10 bg-neutral-900/50 backdrop-blur-xl ring-1 ring-amber-500/10",
    badgeIcon: "text-neutral-400",
    cta: "rounded-lg border border-white/90 bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/45",
    ctaHover: "hover:border-white hover:shadow-[0_0_24px_rgba(245,158,11,0.45)]",
  },
  security: {
    id: "security",
    label: "Security",
    shell: TOOL_GLASS_SHELL_BASE,
    dropzone:
      "rounded-[16px] border border-violet-500/70 bg-neutral-950/40 ring-1 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.35)] backdrop-blur-sm transition-[border-color,box-shadow] duration-200",
    dropzoneActive:
      "border-violet-400/90 ring-violet-400/70 shadow-[0_0_28px_rgba(139,92,246,0.5)]",
    dropzoneHover: "group-hover:border-violet-500/80 group-hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]",
    panel:
      "rounded-[20px] border border-white/10 bg-neutral-900/50 backdrop-blur-xl ring-1 ring-violet-500/10",
    badgeIcon: "text-neutral-400",
    cta: "rounded-lg border border-white/90 bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] ring-1 ring-violet-500/45",
    ctaHover: "hover:border-white hover:shadow-[0_0_24px_rgba(139,92,246,0.45)]",
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
