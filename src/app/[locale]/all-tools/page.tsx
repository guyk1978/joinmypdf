import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import {
  AllToolsDirectoryGrid,
  type AllToolsDirectoryCategory,
} from "@/components/AllToolsDirectoryGrid";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import {
  buildInventoryGridItems,
  listDedicatedInventoryHubLinks,
} from "@/lib/tools-inventory-query";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale, namespace: "AllToolsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/all-tools` },
  };
}

export default async function AllToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tPage = await getTranslations("AllToolsPage");
  const tTools = await getTranslations("Tools");

  const categories: AllToolsDirectoryCategory[] = listDedicatedInventoryHubLinks().map((hub) => ({
    id: hub.id,
    title: resolveCategoryTitle(hub.id, hub.title, tPage),
    tools: buildInventoryGridItems(hub.id, tTools, locale)
      .map(({ href, label, slugHint }) => ({ href, label, slugHint }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
  }));

  const toolCount = categories.reduce((sum, category) => sum + category.tools.length, 0);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: tPage("title"),
          description: tPage("metaDescription"),
          url: absoluteUrl(`/${locale}/all-tools`),
          numberOfItems: toolCount,
        }}
      />

      <AppPageShell>
        <div className="all-tools-directory-page page-container">
          <header className="all-tools-directory-page__head">
            <h1 className="all-tools-directory-page__title">{tPage("title")}</h1>
            <p className="all-tools-directory-page__desc">
              {tPage("description", { count: toolCount, categories: categories.length })}
            </p>
          </header>

          <AllToolsDirectoryGrid
            categories={categories}
            expandLabel={tPage("expandCategory")}
            collapseLabel={tPage("collapseCategory")}
          />
        </div>
      </AppPageShell>
    </>
  );
}
