/** Category slugs from tools.json — drives neon-accented dark glassmorphism. */
export type ToolGlassCategory = "convert" | "edit" | "optimize" | "security";

export type ToolGlassTheme = {
  id: ToolGlassCategory;
  label: string;
  /** Tailwind ring/shadow accent for dropzone focus */
  dropzone: string;
  dropzoneActive: string;
  dropzoneHover: string;
  /** Outer tool upload shell */
  shell: string;
  /** Post-upload / settings panels */
  panel: string;
  /** Discreet privacy badge */
  badge: string;
  badgeIcon: string;
  /** Primary CTA accent inside dropzone */
  cta: string;
  ctaHover: string;
};

const glassBase =
  "rounded-2xl border backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-200";

export const TOOL_GLASS_THEME: Record<ToolGlassCategory, ToolGlassTheme> = {
  convert: {
    id: "convert",
    label: "Convert",
    shell: `${glassBase} border-blue-400/25 bg-blue-500/[0.05] shadow-[0_0_40px_rgba(59,130,246,0.08)] ring-1 ring-blue-400/15 dark:border-blue-400/35 dark:bg-blue-500/[0.08] dark:shadow-[0_0_48px_rgba(59,130,246,0.14)]`,
    dropzone: `${glassBase} border-blue-400/35 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(59,130,246,0.12)] ring-1 ring-blue-400/20 dark:border-blue-400/45 dark:bg-black/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_36px_rgba(59,130,246,0.18)]`,
    dropzoneActive: "border-blue-400/70 ring-blue-400/45 shadow-[0_0_40px_rgba(59,130,246,0.28)]",
    dropzoneHover: "group-hover:border-blue-400/55 group-hover:ring-blue-400/30",
    panel: `${glassBase} border-blue-400/20 bg-white/[0.03] ring-1 ring-blue-400/10 dark:border-blue-400/30 dark:bg-black/25`,
    badge: "border-blue-400/25 bg-blue-500/[0.06] text-blue-900/80 dark:border-blue-400/35 dark:bg-blue-500/10 dark:text-blue-100/90",
    badgeIcon: "text-blue-500 dark:text-blue-300",
    cta: "border-blue-400/40 bg-blue-500/10 text-blue-950 ring-1 ring-blue-400/25 dark:border-blue-400/50 dark:bg-blue-500/15 dark:text-blue-50",
    ctaHover: "hover:border-blue-400/60 hover:bg-blue-500/20 hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]",
  },
  edit: {
    id: "edit",
    label: "Edit",
    shell: `${glassBase} border-emerald-400/25 bg-emerald-500/[0.05] shadow-[0_0_40px_rgba(16,185,129,0.08)] ring-1 ring-emerald-400/15 dark:border-emerald-400/35 dark:bg-emerald-500/[0.08] dark:shadow-[0_0_48px_rgba(16,185,129,0.14)]`,
    dropzone: `${glassBase} border-emerald-400/35 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(16,185,129,0.12)] ring-1 ring-emerald-400/20 dark:border-emerald-400/45 dark:bg-black/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_36px_rgba(16,185,129,0.18)]`,
    dropzoneActive: "border-emerald-400/70 ring-emerald-400/45 shadow-[0_0_40px_rgba(16,185,129,0.28)]",
    dropzoneHover: "group-hover:border-emerald-400/55 group-hover:ring-emerald-400/30",
    panel: `${glassBase} border-emerald-400/20 bg-white/[0.03] ring-1 ring-emerald-400/10 dark:border-emerald-400/30 dark:bg-black/25`,
    badge: "border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-900/80 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-100/90",
    badgeIcon: "text-emerald-500 dark:text-emerald-300",
    cta: "border-emerald-400/40 bg-emerald-500/10 text-emerald-950 ring-1 ring-emerald-400/25 dark:border-emerald-400/50 dark:bg-emerald-500/15 dark:text-emerald-50",
    ctaHover: "hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]",
  },
  optimize: {
    id: "optimize",
    label: "Optimize",
    shell: `${glassBase} border-amber-400/25 bg-amber-500/[0.05] shadow-[0_0_40px_rgba(245,158,11,0.08)] ring-1 ring-amber-400/15 dark:border-amber-400/35 dark:bg-amber-500/[0.08] dark:shadow-[0_0_48px_rgba(245,158,11,0.14)]`,
    dropzone: `${glassBase} border-amber-400/35 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(245,158,11,0.12)] ring-1 ring-amber-400/20 dark:border-amber-400/45 dark:bg-black/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_36px_rgba(245,158,11,0.18)]`,
    dropzoneActive: "border-amber-400/70 ring-amber-400/45 shadow-[0_0_40px_rgba(245,158,11,0.28)]",
    dropzoneHover: "group-hover:border-amber-400/55 group-hover:ring-amber-400/30",
    panel: `${glassBase} border-amber-400/20 bg-white/[0.03] ring-1 ring-amber-400/10 dark:border-amber-400/30 dark:bg-black/25`,
    badge: "border-amber-400/25 bg-amber-500/[0.06] text-amber-950/80 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-100/90",
    badgeIcon: "text-amber-500 dark:text-amber-300",
    cta: "border-amber-400/40 bg-amber-500/10 text-amber-950 ring-1 ring-amber-400/25 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-50",
    ctaHover: "hover:border-amber-400/60 hover:bg-amber-500/20 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]",
  },
  security: {
    id: "security",
    label: "Security",
    shell: `${glassBase} border-violet-400/25 bg-violet-500/[0.05] shadow-[0_0_40px_rgba(139,92,246,0.08)] ring-1 ring-violet-400/15 dark:border-violet-400/35 dark:bg-violet-500/[0.08] dark:shadow-[0_0_48px_rgba(139,92,246,0.14)]`,
    dropzone: `${glassBase} border-violet-400/35 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(139,92,246,0.12)] ring-1 ring-violet-400/20 dark:border-violet-400/45 dark:bg-black/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_36px_rgba(139,92,246,0.18)]`,
    dropzoneActive: "border-violet-400/70 ring-violet-400/45 shadow-[0_0_40px_rgba(139,92,246,0.28)]",
    dropzoneHover: "group-hover:border-violet-400/55 group-hover:ring-violet-400/30",
    panel: `${glassBase} border-violet-400/20 bg-white/[0.03] ring-1 ring-violet-400/10 dark:border-violet-400/30 dark:bg-black/25`,
    badge: "border-violet-400/25 bg-violet-500/[0.06] text-violet-900/80 dark:border-violet-400/35 dark:bg-violet-500/10 dark:text-violet-100/90",
    badgeIcon: "text-violet-500 dark:text-violet-300",
    cta: "border-violet-400/40 bg-violet-500/10 text-violet-950 ring-1 ring-violet-400/25 dark:border-violet-400/50 dark:bg-violet-500/15 dark:text-violet-50",
    ctaHover: "hover:border-violet-400/60 hover:bg-violet-500/20 hover:shadow-[0_0_16px_rgba(139,92,246,0.2)]",
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
