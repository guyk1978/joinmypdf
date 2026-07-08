import { ArrowRight, BadgeCheck, ServerOff, Zap, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BlogThumbnailGenerator } from "@/components/BlogThumbnailGenerator";
import { HomeAuthorityFaq } from "@/components/HomeAuthorityFaq";
import { getLocalizedBlogReadTime } from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import { resolveBlogCardCoverImage } from "@/lib/blog-cover-image";
import type { BlogPost } from "@/lib/types";

const PILLARS: { key: "local" | "fast" | "free"; Icon: LucideIcon }[] = [
  { key: "local", Icon: ServerOff },
  { key: "fast", Icon: Zap },
  { key: "free", Icon: BadgeCheck },
];

type HomeAuthoritySectionProps = {
  latestPosts: BlogPost[];
  locale: string;
};

function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}

export async function HomeAuthoritySection({ latestPosts, locale }: HomeAuthoritySectionProps) {
  const tHome = await getTranslations("Home");
  const tBlog = await getTranslations("Blog");

  return (
    <>
      <section className="home-whyus" aria-labelledby="home-whyus-title">
        <div className="home-section-head">
          <p className="home-section-head__eyebrow">{tHome("landing.whyUsEyebrow")}</p>
          <h2 id="home-whyus-title" className="home-section-head__title">
            {tHome("landing.whyUsTitle")}
          </h2>
          <p className="home-section-head__subtitle">{tHome("landing.whyUsSubtitle")}</p>
        </div>

        <div className="home-whyus__pillars">
          {PILLARS.map(({ key, Icon }) => (
            <div key={key} className="home-whyus-pillar">
              <span className="home-whyus-pillar__icon" aria-hidden>
                <Icon strokeWidth={1.5} />
              </span>
              <h3 className="home-whyus-pillar__title">
                {tHome(`landing.pillars.${key}.title`)}
              </h3>
              <p className="home-whyus-pillar__desc">
                {tHome(`landing.pillars.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        <p className="home-whyus__overview">{tHome("seoOverview")}</p>

        <HomeAuthorityFaq />
      </section>

      {latestPosts.length > 0 ? (
        <section className="home-resources" aria-labelledby="home-resources-title">
          <div className="home-section-head home-section-head--inline">
            <div>
              <p className="home-section-head__eyebrow">{tHome("landing.resourcesEyebrow")}</p>
              <h2 id="home-resources-title" className="home-section-head__title">
                {tHome("landing.resourcesTitle")}
              </h2>
            </div>
            <Link href="/blog/" className="home-section-head__link" prefetch={false}>
              {tHome("viewAllGuides")}
              <ArrowRight className="home-section-head__link-icon" aria-hidden />
            </Link>
          </div>

          <div className="home-resources__grid">
            {latestPosts.map((post) => {
              const excerpt = getGuideExcerpt(post);
              const category = resolveBlogDisplayCategory(post);
              const coverImage = resolveBlogCardCoverImage(post);
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}/`}
                  className="home-resource-card group"
                  prefetch={false}
                >
                  <span className="home-resource-card__thumb">
                    {coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={coverImage}
                        alt={tHome("landing.resourceThumbAlt")}
                        loading="lazy"
                      />
                    ) : (
                      <BlogThumbnailGenerator slug={post.slug} category={category} />
                    )}
                  </span>
                  <span className="home-resource-card__body">
                    <span className="home-resource-card__title">{post.title}</span>
                    {excerpt ? (
                      <span className="home-resource-card__excerpt">{excerpt}</span>
                    ) : null}
                    <span className="home-resource-card__meta">
                      {getLocalizedBlogReadTime(post, tBlog)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
