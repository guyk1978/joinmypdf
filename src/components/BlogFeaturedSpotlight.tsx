import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { clsx } from "clsx";
import { BlogCardVisual } from "@/components/BlogCardVisual";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import { resolveBlogCardCoverImage } from "@/lib/blog-cover-image";
import { getGuideExcerpt } from "@/lib/blog-excerpt";
import { blogArticlePath } from "@/lib/blog-article-path";
import type { BlogPost } from "@/lib/types";

type BlogFeaturedSpotlightProps = {
  posts: BlogPost[];
};

export async function BlogFeaturedSpotlight({ posts }: BlogFeaturedSpotlightProps) {
  if (!posts.length) return null;

  const t = await getTranslations("Blog");
  const [lead, ...rest] = posts;

  return (
    <section className="blog-magazine-spotlight" aria-labelledby="blog-magazine-spotlight-title">
      <header className="blog-magazine-spotlight__head">
        <p className="blog-magazine-spotlight__eyebrow">{t("featuredSpotlightEyebrow")}</p>
        <h2 id="blog-magazine-spotlight-title" className="blog-magazine-spotlight__title">
          {t("featuredSpotlight")}
        </h2>
      </header>

      <div className="blog-magazine-spotlight__grid">
        <SpotlightCard post={lead} t={t} featured />

        {rest.length > 0 ? (
          <div className="blog-magazine-spotlight__secondary">
            {rest.map((post) => (
              <SpotlightCard key={post.slug} post={post} t={t} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type SpotlightCardProps = {
  post: BlogPost;
  t: Awaited<ReturnType<typeof getTranslations>>;
  featured?: boolean;
};

async function SpotlightCard({ post, t, featured = false }: SpotlightCardProps) {
  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const excerpt = getGuideExcerpt(post);
  const coverImage = resolveBlogCardCoverImage(post);
  const generated = !coverImage;

  return (
    <Link
      href={blogArticlePath(post.slug)}
      className={clsx(
        "blog-magazine-spotlight-card group",
        featured && "blog-magazine-spotlight-card--lead",
        generated && "blog-magazine-spotlight-card--generated",
      )}
      prefetch={false}
    >
      <BlogCardVisual
        slug={post.slug}
        category={category}
        coverImage={coverImage}
        variant="spotlight"
        featured={featured}
        imageLoading={featured ? "eager" : "lazy"}
      />

      <div className="blog-magazine-spotlight-card__body">
        {categoryLabel ? (
          <p className="blog-magazine-spotlight-card__label">{categoryLabel}</p>
        ) : null}
        <h3 className="blog-magazine-spotlight-card__title">{post.title}</h3>
        {excerpt ? <p className="blog-magazine-spotlight-card__excerpt">{excerpt}</p> : null}
        {readTime ? (
          <p className="blog-magazine-spotlight-card__meta">
            <Clock className="blog-magazine-spotlight-card__meta-icon" aria-hidden />
            {readTime}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
