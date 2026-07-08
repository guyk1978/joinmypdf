import { getTranslations } from "next-intl/server";
import { BlogArticleCard } from "@/components/BlogArticleCard";
import type { BlogPost } from "@/lib/types";

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
      <ul className="blog-magazine-related__grid">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogArticleCard post={post} />
          </li>
        ))}
      </ul>
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
      <ul className="blog-magazine-footer-rail__grid">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogArticleCard post={post} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
