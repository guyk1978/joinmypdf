import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/FaqAccordion";
import { faqLd, JsonLd } from "@/lib/schema";

const MAX_FAQ_ITEMS = 6;

/** Keys under the `CategorySeo` message namespace (hub / directory ids). */
export type CategorySeoId = string;

/**
 * SEO prose + FAQ block for category hub pages — server-rendered from the
 * `CategorySeo` translation namespace, keyed by category id.
 * Renders nothing when a category has no copy for the active locale.
 */
export async function CategorySeoSection({
  categoryId,
}: {
  categoryId: CategorySeoId;
}) {
  const t = await getTranslations("CategorySeo");

  if (!t.has(`${categoryId}.title`)) return null;

  const paragraphs: string[] = [];
  for (const key of [`${categoryId}.p1`, `${categoryId}.p2`]) {
    if (t.has(key)) paragraphs.push(t(key));
  }

  const faqs: { q: string; a: string }[] = [];
  for (let i = 1; i <= MAX_FAQ_ITEMS; i += 1) {
    const qKey = `${categoryId}.faq.q${i}`;
    const aKey = `${categoryId}.faq.a${i}`;
    if (!t.has(qKey) || !t.has(aKey)) break;
    faqs.push({ q: t(qKey), a: t(aKey) });
  }

  return (
    <section className="category-seo" aria-labelledby="category-seo-title">
      {faqs.length > 0 ? <JsonLd data={faqLd(faqs)} /> : null}

      <h2 id="category-seo-title" className="category-seo__title">
        {t(`${categoryId}.title`)}
      </h2>

      {paragraphs.map((paragraph, index) => (
        <p key={index} className="category-seo__text">
          {paragraph}
        </p>
      ))}

      {faqs.length > 0 ? (
        <div className="category-seo__faq">
          <h3 className="category-seo__faq-title">{t("faqTitle")}</h3>
          <FaqAccordion items={faqs} />
        </div>
      ) : null}
    </section>
  );
}
