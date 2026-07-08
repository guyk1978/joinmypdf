import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText, Layers, Lock, PenLine } from "lucide-react";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

export type BlogThumbnailTheme = {
  angle: number;
  orbX: number;
  orbY: number;
  orbScale: number;
  patternOpacity: number;
};

const CATEGORY_ICONS: Record<BlogDisplayCategory, LucideIcon> = {
  conversion: FileText,
  editing: PenLine,
  security: Lock,
  advanced: Layers,
};

const CATEGORY_GLOW: Record<BlogDisplayCategory, string> = {
  conversion: "59, 130, 246",
  editing: "249, 115, 22",
  security: "16, 185, 129",
  advanced: "139, 92, 246",
};

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getBlogThumbnailPatternId(category: BlogDisplayCategory, slug: string): string {
  return `thumb-grid-${category}-${hashSlug(`${category}:${slug}`)}`;
}

export function getBlogCategoryThumbnailIcon(category: BlogDisplayCategory): LucideIcon {
  return CATEGORY_ICONS[category];
}

export function getBlogThumbnailTheme(
  category: BlogDisplayCategory,
  slug: string,
): BlogThumbnailTheme {
  const hash = hashSlug(`${category}:${slug}`);
  const variant = hash % 6;

  const angles = [132, 148, 165, 118, 155, 140];
  const orbX = [18, 72, 42, 58, 28, 64][variant];
  const orbY = [22, 68, 48, 32, 74, 40][variant];
  const orbScale = [1, 0.85, 1.1, 0.92, 1.05, 0.88][variant];
  const patternOpacity = [0.045, 0.055, 0.04, 0.05, 0.048, 0.052][variant];

  return {
    angle: angles[variant]!,
    orbX,
    orbY,
    orbScale,
    patternOpacity,
  };
}

export function getBlogThumbnailGradientStyle(
  category: BlogDisplayCategory,
  slug: string,
): CSSProperties {
  const theme = getBlogThumbnailTheme(category, slug);
  const glow = CATEGORY_GLOW[category];

  return {
    "--thumb-angle": `${theme.angle}deg`,
    "--thumb-orb-x": `${theme.orbX}%`,
    "--thumb-orb-y": `${theme.orbY}%`,
    "--thumb-orb-scale": String(theme.orbScale),
    "--thumb-glow": glow,
    "--thumb-pattern-opacity": String(theme.patternOpacity),
  } as CSSProperties;
}
