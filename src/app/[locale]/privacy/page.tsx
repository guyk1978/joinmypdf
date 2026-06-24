import type { Metadata } from "next";
export const runtime = "edge";
import { clsx } from "clsx";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { PrivacyPolicyHero } from "@/components/PrivacyPolicyHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { contentDashboardInset, contentDashboardPanel, homeSecondaryPillBtn } from "@/lib/tool-ui";
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
      <div className="home-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <PrivacyPolicyHero />
        <main className="privacy-policy-content home-tool-grid-shell mx-auto w-full max-w-4xl lg:max-w-5xl">
          <div className="flex flex-col gap-8 md:gap-10">
            {SECTION_KEYS.map((key) => {
              const Icon = sectionIcons[key];
              const showLocalHighlight = key === "onDevice";

              return (
                <section
                  key={key}
                  className={clsx(contentDashboardPanel, "privacy-section")}
                  aria-labelledby={`privacy-section-${key}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
                    <h2 id={`privacy-section-${key}`} className="privacy-section__title text-lg md:text-xl">
                      {t(`sections.${key}.title`)}
                    </h2>
                  </div>

                  {showLocalHighlight ? (
                    <aside className={clsx(contentDashboardInset, "mt-6")}>
                      <p className="privacy-section__prose text-sm font-semibold uppercase tracking-wide">
                        {t("localProcessingBadge")}
                      </p>
                      <p className="privacy-section__prose mt-2">{t("localProcessingHighlight")}</p>
                    </aside>
                  ) : null}

                  <p className="privacy-section__prose mt-6">{t(bodyKeys[key])}</p>
                </section>
              );
            })}

            <section className="privacy-section privacy-section--center" aria-label={t("relatedLabel")}>
              <Link href="/privacy-first/" className={homeSecondaryPillBtn} prefetch={false}>
                {t("privacyFirstLink")}
              </Link>
            </section>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
