import { clsx } from "clsx";
import { BlogThumbnailGenerator } from "@/components/BlogThumbnailGenerator";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

type BlogCardVisualProps = {
  slug: string;
  category: BlogDisplayCategory;
  categoryLabel: string;
  coverImage: string | null;
  variant?: "card" | "spotlight";
  featured?: boolean;
  imageLoading?: "lazy" | "eager";
};

export function BlogCardVisual({
  slug,
  category,
  categoryLabel,
  coverImage,
  variant = "card",
  featured = false,
  imageLoading = "lazy",
}: BlogCardVisualProps) {
  const isSpotlight = variant === "spotlight";
  const visualClass = isSpotlight
    ? clsx(
        "blog-magazine-spotlight-card__visual",
        featured && "blog-magazine-spotlight-card__visual--lead",
      )
    : "blog-magazine-card__visual";

  const imageClass = isSpotlight
    ? "blog-magazine-spotlight-card__image"
    : "blog-magazine-card__image";

  return (
    <div className={visualClass}>
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt="" className={imageClass} loading={imageLoading} />
      ) : (
        <BlogThumbnailGenerator
          slug={slug}
          category={category}
          size={isSpotlight && featured ? "large" : "default"}
        />
      )}
      <span className={clsx("blog-category-badge", `blog-category-badge--${category}`)}>
        {categoryLabel}
      </span>
    </div>
  );
}
