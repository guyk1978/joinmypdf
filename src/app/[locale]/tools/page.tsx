import type { Metadata } from "next";
export const runtime = "edge";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock, Shield } from "lucide-react";
import { ToolsDirectoryToolGrid } from "@/components/ToolsDirectoryToolGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSearch } from "@/components/SiteSearch";
import { Link } from "@/i18n/navigation";
import { blogRegistry } from "@/lib/blog-registry";
import { getTotalToolCount } from "@/lib/featured-tools";
import { translateToolItem, translateToolSection } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { appShell, contentDashboardStack, homeSecondaryPillBtn } from "@/lib/tool-ui";
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

  return {
    title: t("title"),
    description: t("description", { count: toolCount }),
    alternates: { canonical: `/${locale}/tools` },
    openGraph: {
      title: t("title"),
      description: t("description", { count: toolCount }),
      url: absoluteUrl(`/${locale}/tools`),
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
      <div className={appShell}>
        <SiteHeader />
        <main className="home-tool-grid-page">
          <div className="home-tool-grid-shell mx-auto w-full">
            <header className="mb-[3px] max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                {tPage("badge")}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
                {tPage("title")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-base">
                {tPage("description", { count: toolCount })}
              </p>
              <div className="mt-5 max-w-xl">
                <SiteSearch variant="hero" registry={registry} blog={blogRegistry} />
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-4 w-4 shrink-0" aria-hidden />
                  {tPage("clientSide")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4 shrink-0" aria-hidden />
                  <Link
                    href="/privacy-first/"
                    className="font-medium text-neutral-700 hover:underline dark:text-neutral-300"
                  >
                    {tPage("privacyFirst")}
                  </Link>
                </span>
              </p>
            </header>

            <div className={contentDashboardStack}>
              <section className="flex flex-col gap-3" aria-labelledby="featured-tools">
                <div>
                  <h2 id="featured-tools" className="text-xl font-semibold text-neutral-900 dark:text-white md:text-2xl">
                    {tPage("startHere")}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tPage("startHereDescription")}</p>
                </div>
                <ToolsDirectoryToolGrid items={featuredItems} />
              </section>

              {categorySections.map((section) => (
                <section
                  key={section.id}
                  className="flex flex-col gap-3 scroll-mt-24"
                  aria-labelledby={`${section.id}-tools`}
                  id={section.id}
                >
                  <div>
                    <h2
                      id={`${section.id}-tools`}
                      className="text-xl font-semibold text-neutral-900 dark:text-white md:text-2xl"
                    >
                      {section.label}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {section.items.length === 1
                        ? tPage("toolCount", { count: section.items.length })
                        : tPage("toolCountPlural", { count: section.items.length })}
                    </p>
                  </div>
                  <ToolsDirectoryToolGrid items={section.items} />
                </section>
              ))}
            </div>

            <div className="mt-[3px] flex justify-center pt-6">
              <Link href="/favorites/" className={homeSecondaryPillBtn}>
                {tHome("viewFavorites")}
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
