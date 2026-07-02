import type { Metadata } from "next";


import { clsx } from "clsx";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { Link } from "@/i18n/navigation";
import { getBrandName } from "@/lib/brand";
import { imBtnCta } from "@/lib/design-system";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cpu, Gauge, LineChart, ShieldCheck } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTION_KEYS = ["philosophy", "onDevice", "performance", "analytics"] as const;

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

  const bodyKeys = {
    philosophy: "p1",
    onDevice: "p2",
    performance: "p3",
    analytics: "p4",
  } as const;

  const sectionIcons = {
    philosophy: ShieldCheck,
    onDevice: Cpu,
    performance: Gauge,
    analytics: LineChart,
  } as const;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${t("title")} — ${getBrandName(locale)}`,
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/privacy`),
        }}
      />
      <AppPageShell mainClassName={productPageMainClassName}>
        <ProductPageLayout title={t("title")} description={t("intro")} variant="document">
          <div className="product-page-document-stack flex flex-col gap-6">
            {SECTION_KEYS.map((key) => {
              const Icon = sectionIcons[key];
              const showLocalHighlight = key === "onDevice";

              return (
                <section
                  key={key}
                  className="im-content-panel privacy-section"
                  aria-labelledby={`privacy-section-${key}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-[var(--im-text-subtle)]" aria-hidden />
                    <h2 id={`privacy-section-${key}`} className="info-prose-document__heading m-0">
                      {t(`sections.${key}.title`)}
                    </h2>
                  </div>

                  {showLocalHighlight ? (
                    <aside className="im-content-panel im-content-panel--inset">
                      <p className="product-page-meta m-0">{t("localProcessingBadge")}</p>
                      <p className="info-prose-document__paragraph mt-2 mb-0">{t("localProcessingHighlight")}</p>
                    </aside>
                  ) : null}

                  <p className="info-prose-document__paragraph mt-6 mb-0">{t(bodyKeys[key])}</p>
                </section>
              );
            })}

            <section className="privacy-section privacy-section--center text-center" aria-label={t("relatedLabel")}>
              <Link href="/privacy-first/" className={clsx(imBtnCta, "im-btn-cta--rounded")} prefetch={false}>
                {t("privacyFirstLink")}
              </Link>
            </section>
          </div>
        </ProductPageLayout>
      </AppPageShell>
    </>
  );
}
