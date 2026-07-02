import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalizedBlogReadTime } from "@/lib/blog-card-i18n";
import type { BlogPost } from "@/lib/types";

const FAQ_KEYS = ["upload", "free", "professional"] as const;

type HomeAuthoritySectionProps = {
  latestPosts: BlogPost[];
};

function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}

export async function HomeAuthoritySection({ latestPosts }: HomeAuthoritySectionProps) {
  const tHome = await getTranslations("Home");
  const tBlog = await getTranslations("Blog");

  return (
    <section className="home-authority-section" aria-labelledby="home-authority-overview-heading">
      <section className="home-authority-block home-authority-block--overview">
        <h2 id="home-authority-overview-heading" className="sr-only">
          {tHome("authorityOverviewTitle")}
        </h2>
        <p className="home-authority-overview">{tHome("seoOverview")}</p>
      </section>

      <section className="home-authority-block" aria-labelledby="home-faq-heading">
        <h2 id="home-faq-heading" className="home-authority-heading">
          {tHome("faqTitle")}
        </h2>
        <div className="home-authority-faq-list">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="home-authority-faq-item">
              <summary className="home-authority-faq-item__summary">{tHome(`faq.${key}.q`)}</summary>
              <div className="home-authority-faq-item__answer">
                <p className="home-authority-faq-item__body">{tHome(`faq.${key}.a`)}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {latestPosts.length > 0 ? (
        <section className="home-authority-block" aria-labelledby="home-latest-guides-heading">
          <div className="home-authority-block__header">
            <h2 id="home-latest-guides-heading" className="home-authority-heading">
              {tHome("latestGuidesTitle")}
            </h2>
            <Link href="/blog/" className="home-minimal-section__link home-minimal-section__link--header" prefetch={false}>
              {tHome("viewAllGuides")}
              <ArrowRight className="home-minimal-section__link-icon" aria-hidden />
            </Link>
          </div>
          <div className="home-latest-guides-row">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="home-latest-guide-card"
                prefetch={false}
              >
                <h3 className="home-latest-guide-card__title">{post.title}</h3>
                {getGuideExcerpt(post) ? (
                  <p className="home-latest-guide-card__excerpt">{getGuideExcerpt(post)}</p>
                ) : null}
                <p className="home-latest-guide-card__meta">{getLocalizedBlogReadTime(post, tBlog)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
