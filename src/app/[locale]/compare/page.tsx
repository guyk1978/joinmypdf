import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Link } from "@/i18n/navigation";
import { faqLd, homeSoftwareApplicationLd, JsonLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const ROW_KEYS = ["processing", "watermarks", "breadth", "bestFor"] as const;
const FAQ_KEYS = [
  "localAdvantages",
  "uploaded",
  "whyCompare",
  "browserTools",
  "watermarks",
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Compare" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/compare` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Compare");
  const pathname = `/${locale}/compare`;

  const faqs = FAQ_KEYS.map((key) => ({
    q: t(`faqs.${key}.q`),
    a: t(`faqs.${key}.a`),
  }));

  const authorityParagraphs = ["p1", "p2", "p3", "p4"] as const;

  return (
    <>
      <JsonLd
        data={homeSoftwareApplicationLd({
          locale,
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
        })}
      />
      <JsonLd data={faqLd(faqs)} />

      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("intro")} variant="document">
          <section
            className="im-content-panel privacy-section !pb-0"
            aria-labelledby="compare-table"
          >
            <h2 id="compare-table" className="info-prose-document__heading mb-4">
              {t("tableHeading")}
            </h2>
            <ComparisonTable
              locale={locale}
              flush
              headers={{
                topic: t("colTopic"),
                typical: t("colTypical"),
                join: t("colJoin"),
              }}
              rows={ROW_KEYS.map((key) => ({
                topic: t(`rows.${key}.topic`),
                typical: t(`rows.${key}.typical`),
                join: t(`rows.${key}.join`),
              }))}
            />
          </section>

          <section
            className="info-prose-document mt-10"
            aria-labelledby="compare-authority-title"
          >
            <h2 id="compare-authority-title" className="info-prose-document__heading">
              {t("authority.title")}
            </h2>
            {authorityParagraphs.map((key) => (
              <p key={key} className="info-prose-document__paragraph">
                {t(`authority.${key}`)}
              </p>
            ))}
          </section>

          <section className="info-prose-document mt-10" aria-labelledby="compare-faq-title">
            <h2 id="compare-faq-title" className="info-prose-document__heading">
              {t("faqHeading")}
            </h2>
            <dl className="compare-authority-faq">
              {faqs.map((item) => (
                <div key={item.q} className="compare-authority-faq__item">
                  <dt className="compare-authority-faq__q">{item.q}</dt>
                  <dd className="compare-authority-faq__a">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="info-prose-document__paragraph mt-10 text-center">
            <Link
              href="/tools/"
              className="home-minimal-section__link text-base font-semibold"
              prefetch={false}
            >
              {t("ctaAuthority")}
            </Link>
          </p>

          <p className="info-prose-document__paragraph mt-4 text-center text-sm text-[#a3a3a3]">
            {t("ctaPrefix")}{" "}
            <Link href="/tools/pdf-merge/" className="home-minimal-section__link" prefetch={false}>
              {t("ctaMerge")}
            </Link>{" "}
            {t("ctaMiddle")}{" "}
            <Link href="/privacy-first/" className="home-minimal-section__link" prefetch={false}>
              {t("ctaPrivacy")}
            </Link>
            .
          </p>
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
