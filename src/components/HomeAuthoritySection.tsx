import { BadgeCheck, ServerOff, Zap, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HomeSectionBar } from "@/components/HomeSectionBar";
import { getLocalizedBlogReadTime } from "@/lib/blog-card-i18n";
import type { BlogPost } from "@/lib/types";

const PILLARS: { key: "local" | "fast" | "free"; Icon: LucideIcon }[] = [
  { key: "local", Icon: ServerOff },
  { key: "fast", Icon: Zap },
  { key: "free", Icon: BadgeCheck },
];

const FAQ_KEYS = ["upload", "free", "professional"] as const;

type HomeAuthoritySectionProps = {
  latestPosts: BlogPost[];
  locale: string;
};

export async function HomeAuthoritySection({ latestPosts }: HomeAuthoritySectionProps) {
  const tHome = await getTranslations("Home");
  const tBlog = await getTranslations("Blog");

  return (
    <>
      <section className="home-im-section home-whyus" aria-labelledby="home-whyus-title">
        <HomeSectionBar
          id="home-whyus-title"
          title={tHome("landing.whyUsTitle")}
        />
        <ul className="home-im-grid">
          {PILLARS.map(({ key, Icon }) => (
            <li key={key} className="home-im-grid__item">
              <article className="home-im-value-card">
                <span className="home-im-value-card__icon" aria-hidden>
                  <Icon strokeWidth={1.5} />
                </span>
                <h3 className="home-im-value-card__title">
                  {tHome(`landing.pillars.${key}.title`)}
                </h3>
                <p className="home-im-value-card__desc">
                  {tHome(`landing.pillars.${key}.description`)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-im-section home-whyus-faq" aria-labelledby="home-faq-title">
        <HomeSectionBar id="home-faq-title" title={tHome("faqTitle")} />
        <ul className="home-im-grid">
          {FAQ_KEYS.map((key) => (
            <li key={key} className="home-im-grid__item">
              <article className="home-im-value-card">
                <h3 className="home-im-value-card__title">{tHome(`faq.${key}.q`)}</h3>
                <p className="home-im-value-card__desc">{tHome(`faq.${key}.a`)}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {latestPosts.length > 0 ? (
        <section
          className="home-im-section home-resources"
          aria-labelledby="home-resources-title"
        >
          <HomeSectionBar
            id="home-resources-title"
            title={tHome("landing.resourcesTitle")}
            href="/blog/"
            ctaLabel={tHome("viewAllGuides")}
          />
          <ul className="home-im-grid">
            {latestPosts.map((post) => (
              <li key={post.slug} className="home-im-grid__item">
                <Link
                  href={`/blog/${post.slug}/`}
                  className="home-im-value-card home-im-value-card--link"
                  prefetch={false}
                >
                  <span className="home-im-value-card__title">{post.title}</span>
                  <span className="home-im-value-card__meta">
                    {getLocalizedBlogReadTime(post, tBlog)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
