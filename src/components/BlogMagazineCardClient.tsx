import { Clock } from "lucide-react";
import { BlogArticleLink } from "@/components/BlogArticleLink";
import type { BlogMagazineFeedItem } from "@/components/BlogMagazineFeed";

type BlogMagazineCardClientProps = {
  item: BlogMagazineFeedItem;
};

/** Documentation-style list row: title, snippet, and read time — no cover image. */
export function BlogMagazineCardClient({ item }: BlogMagazineCardClientProps) {
  return (
    <BlogArticleLink slug={item.slug} title={item.title} className="blog-doc-item group">
      <h3 className="blog-doc-item__title">{item.title}</h3>
      {item.excerpt ? <p className="blog-doc-item__excerpt">{item.excerpt}</p> : null}
      <p className="blog-doc-item__meta">
        {item.categoryLabel ? (
          <span className="blog-doc-item__category">{item.categoryLabel}</span>
        ) : null}
        {item.subCategoryLabel ? (
          <span className="blog-doc-item__subtopic">{item.subCategoryLabel}</span>
        ) : null}
        {item.readTime ? (
          <span className="blog-doc-item__read-time">
            <Clock className="blog-doc-item__meta-icon" aria-hidden />
            {item.readTime}
          </span>
        ) : null}
      </p>
    </BlogArticleLink>
  );
}
