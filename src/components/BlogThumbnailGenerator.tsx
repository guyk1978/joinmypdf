import { clsx } from "clsx";
import type { BlogDisplayCategory } from "@/lib/blog-categories";
import {
  getBlogCategoryThumbnailIcon,
  getBlogThumbnailGradientStyle,
  getBlogThumbnailPatternId,
} from "@/lib/blog-thumbnail";

type BlogThumbnailGeneratorProps = {
  slug: string;
  category: BlogDisplayCategory;
  className?: string;
  /** Slightly larger icon for spotlight / hero cards */
  size?: "default" | "large";
};

export function BlogThumbnailGenerator({
  slug,
  category,
  className,
  size = "default",
}: BlogThumbnailGeneratorProps) {
  const Icon = getBlogCategoryThumbnailIcon(category);
  const style = getBlogThumbnailGradientStyle(category, slug);
  const patternId = getBlogThumbnailPatternId(category, slug);

  return (
    <div
      className={clsx(
        "blog-thumbnail-generator",
        `blog-thumbnail-generator--${category}`,
        size === "large" && "blog-thumbnail-generator--large",
        className,
      )}
      style={style}
      aria-hidden
    >
      <div className="blog-thumbnail-generator__base" />
      <div className="blog-thumbnail-generator__glow" />
      <svg
        className="blog-thumbnail-generator__pattern"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="320" height="180" fill={`url(#${patternId})`} />
      </svg>
      <Icon className="blog-thumbnail-generator__icon" aria-hidden />
    </div>
  );
}
