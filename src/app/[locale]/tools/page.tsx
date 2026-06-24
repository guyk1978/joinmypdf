import type { Metadata } from "next";
export const runtime = "edge";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolsDirectoryHero } from "@/components/ToolsDirectoryHero";
import { ToolsDirectoryToolGrid } from "@/components/ToolsDirectoryToolGrid";
import { Link } from "@/i18n/navigation";
import { getTotalToolCount } from "@/lib/featured-tools";
import { translateToolItem, translateToolSection } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";
import type { ToolGridItem } from "@/lib/tool-grid";

const FEATURED_SLUGS = [
  "pdf-merge",
  "pdf-compress",
  "jpg-to-pdf",
  "sign-pdf",
  "protect-pdf",
] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ToolsDirectory" });
  const toolCount = getTotalToolCount();
  const social = buildDefaultSocialImages(locale, { alt: t("title") });

  return {
    title: t("title"),
    description: t("description", { count: toolCount }),
    alternates: { canonical: `/${locale}/tools` },
    openGraph: {
      title: t("title"),
      description: t("description", { count: toolCount }),
      url: absoluteUrl(`/${locale}/tools`),
      ...social.openGraph,
    },
    twitter: {
      title: t("title"),
      description: t("description", { count: toolCount }),
      ...social.twitter,
    },
  };
}

function toGridItem(
  tTools: Awaited<ReturnType<typeof getTranslations>>,
  slug: string,
  label: string,
): ToolGridItem {
  return {
    href: `/tools/${slug}/`,
    label: translateToolItem(tTools, slug, label),
    slugHint: slug,
  };
}

export default async function ToolsDirectoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolsDirectory");
  const tHome = await getTranslations({ locale, namespace: "Home" });
  const sections = buildMegaMenuSections();
  const toolCount = getTotalToolCount();

  const featuredItems = FEATURED_SLUGS.map((slug) => {
    const tool = registry.tools.find((t) => t.slug === slug);
    if (!tool) return null;
    return toGridItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title));
  }).filter((item): item is ToolGridItem => Boolean(item));

  const categorySections = sections
    .map((section) => ({
      id: section.id,
      label: translateToolSection(tTools, section.id, section.label),
      items: section.items.map((item) => toGridItem(tTools, item.slug, item.label)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tPage("title"),
          description: tPage("description", { count: toolCount }),
          url: absoluteUrl(`/${locale}/tools`),
          numberOfItems: toolCount,
        }}
      />
      <div className="home-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="home-tool-grid-page">
          <ToolsDirectoryHero />

          <div className="tools-directory-content home-tool-grid-shell mx-auto w-full max-w-[1440px]">
            <section className="tools-directory-section" aria-labelledby="featured-tools">
              <header className="tools-directory-section__header">
                <h2 id="featured-tools" className="tools-directory-section__title">
                  {tPage("startHere")}
                </h2>
              </header>
              <ToolsDirectoryToolGrid items={featuredItems} className="mt-8" />
            </section>

            {categorySections.map((section) => (
              <section
                key={section.id}
                className="tools-directory-section scroll-mt-28"
                aria-labelledby={`${section.id}-tools`}
                id={section.id}
              >
                <header className="tools-directory-section__header">
                  <h2 id={`${section.id}-tools`} className="tools-directory-section__title">
                    {section.label}
                  </h2>
                  <p className="tools-directory-section__description">
                    {section.items.length === 1
                      ? tPage("toolCount", { count: section.items.length })
                      : tPage("toolCountPlural", { count: section.items.length })}
                  </p>
                </header>
                <ToolsDirectoryToolGrid items={section.items} className="mt-8" />
              </section>
            ))}

            <div className="mt-16 flex flex-wrap items-center justify-center gap-4 pb-4">
              <Link href="/favorites/" className={homeSecondaryPillBtn}>
                {tHome("viewFavorites")}
              </Link>
              <Link href="/privacy-first/" className={homePrimaryPillBtn}>
                {tPage("learnPrivacy")}
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
