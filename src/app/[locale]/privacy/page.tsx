import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Link } from "@/i18n/navigation";
import { getBrandName } from "@/lib/brand";
import { faqLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cookie, ShieldCheck, Share2 } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const FAQ_KEYS = ["uploaded", "stored", "secure", "analytics", "verify"] as const;
const HIGHLIGHT_KEYS = ["browser", "noUpload", "sovereignty"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/privacy` },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  const faqs = FAQ_KEYS.map((key) => ({
    q: t(`faqs.${key}.q`),
    a: t(`faqs.${key}.a`),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/privacy`),
          about: {
            "@type": "Thing",
            name: "Local-First PDF processing and data protection",
          },
        }}
      />
      <JsonLd data={faqLd(faqs)} />

      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("intro")} variant="document">
          <div className="product-page-document-stack flex flex-col gap-6">
            <section
              className="im-content-panel privacy-section"
              aria-labelledby="privacy-why-title"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--im-text-subtle)]" aria-hidden />
                <h2 id="privacy-why-title" className="info-prose-document__heading m-0">
                  {t("whyTitle")}
                </h2>
              </div>

              <p className="info-prose-document__paragraph mt-6">{t("whyLead")}</p>
              <p className="info-prose-document__paragraph">{t("whyP1")}</p>
              <p className="info-prose-document__paragraph mb-0">{t("whyP2")}</p>

              <ul className="privacy-policy-summary mt-6">
                {HIGHLIGHT_KEYS.map((key) => (
                  <li key={key}>
                    <strong>{t(`whyHighlights.${key}`)}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section
              className="im-content-panel privacy-section"
              aria-labelledby="privacy-section-dataProcessing"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--im-text-subtle)]" aria-hidden />
                <h2
                  id="privacy-section-dataProcessing"
                  className="info-prose-document__heading m-0"
                >
                  {t("sections.dataProcessing.title")}
                </h2>
              </div>

              <ul className="privacy-policy-summary mt-6">
                <li>
                  <strong>{t("sections.dataProcessing.summary1")}</strong>
                </li>
                <li>
                  <strong>{t("sections.dataProcessing.summary2")}</strong>
                </li>
                <li>
                  <strong>{t("sections.dataProcessing.summary3")}</strong>
                </li>
              </ul>

              <aside className="im-content-panel im-content-panel--inset mt-6">
                <p className="product-page-meta m-0">{t("localProcessingBadge")}</p>
                <p className="info-prose-document__paragraph mt-2 mb-0">
                  {t("localProcessingHighlight")}
                </p>
              </aside>

              <h3 className="privacy-policy-subheading">{t("sections.dataProcessing.h3Local")}</h3>
              <p className="info-prose-document__paragraph mb-0">{t("p1")}</p>
              <p className="info-prose-document__paragraph mt-4 mb-0">{t("p2")}</p>

              <h3 className="privacy-policy-subheading">{t("sections.dataProcessing.h3Limits")}</h3>
              <p className="info-prose-document__paragraph mb-0">{t("p3")}</p>
            </section>

            <section
              className="im-content-panel privacy-section"
              aria-labelledby="privacy-section-thirdParty"
            >
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 shrink-0 text-[var(--im-text-subtle)]" aria-hidden />
                <h2
                  id="privacy-section-thirdParty"
                  className="info-prose-document__heading m-0"
                >
                  {t("sections.thirdParty.title")}
                </h2>
              </div>

              <ul className="privacy-policy-summary mt-6">
                <li>
                  <strong>{t("sections.thirdParty.summary1")}</strong>
                </li>
                <li>
                  <strong>{t("sections.thirdParty.summary2")}</strong>
                </li>
                <li>
                  <strong>{t("sections.thirdParty.summary3")}</strong>
                </li>
              </ul>

              <p className="info-prose-document__paragraph mt-6 mb-0">{t("p4")}</p>
            </section>

            <section
              className="im-content-panel privacy-section"
              aria-labelledby="privacy-section-cookies"
            >
              <div className="flex items-center gap-3">
                <Cookie className="h-5 w-5 shrink-0 text-[var(--im-text-subtle)]" aria-hidden />
                <h2 id="privacy-section-cookies" className="info-prose-document__heading m-0">
                  {t("sections.cookies.title")}
                </h2>
              </div>

              <ul className="privacy-policy-summary mt-6">
                <li>
                  <strong>{t("sections.cookies.summary1")}</strong>
                </li>
                <li>
                  <strong>{t("sections.cookies.summary2")}</strong>
                </li>
                <li>
                  <strong>{t("sections.cookies.summary3")}</strong>
                </li>
              </ul>

              <p className="info-prose-document__paragraph mt-6 mb-0">{t("p5")}</p>
            </section>

            <section
              className="im-content-panel privacy-section"
              aria-labelledby="privacy-faq-title"
            >
              <h2 id="privacy-faq-title" className="info-prose-document__heading m-0">
                {t("faqHeading")}
              </h2>
              <dl className="privacy-policy-faq mt-6">
                {faqs.map((item) => (
                  <div key={item.q} className="privacy-policy-faq__item">
                    <dt className="privacy-policy-faq__q">{item.q}</dt>
                    <dd className="privacy-policy-faq__a">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <nav
              className="privacy-section privacy-section--center flex flex-wrap items-center justify-center gap-4 text-center"
              aria-label={t("relatedLabel")}
            >
              <Link
                href="/tools/"
                className="home-minimal-section__link text-base font-semibold"
                prefetch={false}
              >
                {t("backToTools")}
              </Link>
              <span className="text-[#525252]" aria-hidden>
                ·
              </span>
              <Link
                href="/privacy-first/"
                className="home-minimal-section__link text-base font-semibold"
                prefetch={false}
              >
                {t("learnHowItWorks")}
              </Link>
            </nav>
          </div>
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
