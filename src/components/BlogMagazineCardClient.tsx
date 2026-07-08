import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { BlogCardVisual } from "@/components/BlogCardVisual";
import type { BlogMagazineFeedItem } from "@/components/BlogMagazineFeed";

type BlogMagazineCardClientProps = {
  item: BlogMagazineFeedItem;
};

export function BlogMagazineCardClient({ item }: BlogMagazineCardClientProps) {
  const generated = !item.coverImage;

  return (
    <Link
      href={`/blog/${item.slug}/`}
      className={clsx(
        "blog-magazine-card group",
        generated && "blog-magazine-card--generated",
        generated && `blog-magazine-card--${item.category}`,
      )}
      prefetch={false}
    >
      <BlogCardVisual
        slug={item.slug}
        category={item.category}
        categoryLabel={item.categoryLabel}
        coverImage={item.coverImage}
      />

      <div className="blog-magazine-card__body">
        <h3 className="blog-magazine-card__title">{item.title}</h3>
        {item.excerpt ? <p className="blog-magazine-card__excerpt">{item.excerpt}</p> : null}
        {item.readTime ? (
          <p className="blog-magazine-card__meta">
            <Clock className="blog-magazine-card__meta-icon" aria-hidden />
            {item.readTime}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
