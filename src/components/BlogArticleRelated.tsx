import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { blogArticlePath } from "@/lib/blog-article-path";
import type { BlogPost } from "@/lib/types";

async function RelatedArticleRow({ post }: { post: BlogPost }) {
  const t = await getTranslations("Blog");
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);

  return (
    <Link
      href={blogArticlePath(post.slug)}
      className="blog-doc-item group"
      prefetch={false}
    >
      <h4 className="blog-doc-item__title">{post.title}</h4>
      <p className="blog-doc-item__meta">
        {categoryLabel ? (
          <span className="blog-doc-item__category">{categoryLabel}</span>
        ) : null}
        {readTime ? (
          <span className="blog-doc-item__read-time">
            <Clock className="blog-doc-item__meta-icon" aria-hidden />
            {readTime}
          </span>
        ) : null}
      </p>
    </Link>
  );
}

function RelatedArticleList({ posts }: { posts: BlogPost[] }) {
  return (
    <ul className="blog-related-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <RelatedArticleRow post={post} />
        </li>
      ))}
    </ul>
  );
}

type BlogKeepReadingProps = {
  posts: BlogPost[];
};

export async function BlogKeepReading({ posts }: BlogKeepReadingProps) {
  if (!posts.length) return null;

  const t = await getTranslations("Blog");

  return (
    <section className="blog-magazine-related" aria-labelledby="blog-keep-reading-title">
      <header className="blog-magazine-related__head">
        <h2 id="blog-keep-reading-title" className="blog-magazine-related__title">
          {t("keepReading")}
        </h2>
        <p className="blog-magazine-related__desc">{t("keepReadingDescription")}</p>
      </header>
      <RelatedArticleList posts={posts} />
    </section>
  );
}

type BlogYouMightLikeProps = {
  posts: BlogPost[];
};

export async function BlogYouMightLike({ posts }: BlogYouMightLikeProps) {
  if (!posts.length) return null;

  const t = await getTranslations("Blog");

  return (
    <section className="blog-magazine-footer-rail" aria-labelledby="blog-you-might-like-title">
      <header className="blog-magazine-footer-rail__head">
        <h2 id="blog-you-might-like-title" className="blog-magazine-footer-rail__title">
          {t("youMightAlsoLike")}
        </h2>
        <p className="blog-magazine-footer-rail__desc">{t("youMightAlsoLikeDescription")}</p>
      </header>
      <RelatedArticleList posts={posts} />
    </section>
  );
}
