import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolsDirectoryDashboard } from "@/components/ToolsDirectoryDashboard";
import { translateToolItem, translateToolSection } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections } from "@/lib/mega-menu";
import { getTotalToolCount } from "@/lib/featured-tools";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import type { ToolGridItem } from "@/lib/tool-grid";
import { groupSectionsByWorkflow } from "@/lib/tools-directory-workflows";

const FEATURED_SLUGS = ["pdf-merge", "pdf-compress", "pdf-split"] as const;

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
  href?: string,
): ToolGridItem {
  return {
    href: href ?? `/tools/${slug}/`,
    label: translateToolItem(tTools, slug, label),
    slugHint: slug,
  };
}

export default async function ToolsDirectoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolsDirectory");
  const sections = buildMegaMenuSections();
  const toolCount = getTotalToolCount();

  const featuredItems = FEATURED_SLUGS.map((slug) => {
    const tool = registry.tools.find((t) => t.slug === slug);
    if (!tool) return null;
    return toGridItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title));
  }).filter((item): item is ToolGridItem => Boolean(item));

  const workflowColumns = groupSectionsByWorkflow(sections).map(({ workflow, sections: workflowSections }) => ({
    id: workflow.id,
    title: tPage(`workflows.${workflow.id}.title`),
    description: tPage(`workflows.${workflow.id}.description`),
    categories: workflowSections.map((section) => ({
      id: section.id,
      title: translateToolSection(tTools, section.id, section.label),
      items: section.items.map((item) => toGridItem(tTools, item.slug, item.label, item.href)),
    })),
  }));

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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
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
          />
        </div>
      </AppPageShell>
    </>
  );
}
