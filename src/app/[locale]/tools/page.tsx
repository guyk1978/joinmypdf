import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolsDirectoryDashboard } from "@/components/ToolsDirectoryDashboard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getTotalToolCount } from "@/lib/featured-tools";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import type { ToolGridItem } from "@/lib/tool-grid";
import {
  buildPrimaryInventoryDirectoryGroups,
  resolveInventoryToolLabel,
} from "@/lib/tools-inventory-query";

const FEATURED_SLUGS = ["pdf-merge", "pdf-compress", "pdf-split"] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

function resolveCategoryTitle(
  id: InventoryCategoryId,
  fallback: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  const key = `categories.${id}`;
  return t.has(key) ? t(key) : fallback;
}

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

export default async function ToolsDirectoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolsDirectory");
  const tCategories = await getTranslations("AllToolsPage");
  const toolCount = getTotalToolCount();

  const featuredItems = FEATURED_SLUGS.map((slug): ToolGridItem | null => {
    const entry = getToolsInventoryEntry(slug);
    if (!entry) return null;
    return {
      href: resolveToolHref(slug, entry.primaryCategory, locale),
      label: resolveInventoryToolLabel(slug, tTools),
      slugHint: slug,
    };
  }).filter((item): item is ToolGridItem => Boolean(item));

  const inventoryGroups = buildPrimaryInventoryDirectoryGroups(tTools, locale);
  const workflowColumns = [
    {
      id: "catalog",
      title: tPage("allToolsGridTitle"),
      description: tPage("allToolsGridDescription", { count: toolCount }),
      categories: inventoryGroups.map((group) => ({
        id: group.id,
        title: resolveCategoryTitle(group.id, group.titleFallback, tCategories),
        items: group.items,
      })),
    },
  ];

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
      <AppPageShell>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--catalog page-container">
          <header className="tools-directory-page__head">
            <p className="tools-directory-page__eyebrow">{tPage("badge")}</p>
            <h1 className="tools-directory-page__title">{tPage("title")}</h1>
            <p className="tools-directory-page__desc">{tPage("description", { count: toolCount })}</p>
          </header>

          <ToolsDirectoryDashboard
            featuredItems={featuredItems}
            featuredTitle={tPage("startHere")}
            featuredDescription={tPage("startHereDescription")}
            workflowColumns={workflowColumns}
            showAllTools
          />
        </div>
      </AppPageShell>
    </>
  );
}
