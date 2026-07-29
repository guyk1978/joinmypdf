import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { breadcrumbLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";
import {
  buildWordToolGridItems,
  getWordToolFeatureLabels,
  WORD_TOOLS_HUB_PATH,
} from "@/lib/word-tools";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "WordToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${WORD_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${WORD_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function WordToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("WordToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const gridItems = buildWordToolGridItems(tTools, locale);
  const featureList = getWordToolFeatureLabels(tTools);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubWord"), path: WORD_TOOLS_HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("schemaName"),
          description: t("schemaDescription"),
          url: absoluteUrl(`/${locale}${WORD_TOOLS_HUB_PATH}`),
          numberOfItems: gridItems.length,
          about: featureList,
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <CategoryHubPageHeader
            categoryId="word"
            title={t("title", { count: getCategoryToolCount("word") })}
            description={t("description")}
            variant="bordered"
          />

          <section className="tools-hub-panel border-b border-[#262626] pb-8" aria-label={t("schemaName")}>
            <CategoryDirectoryFlatGrid items={gridItems} categoryId="word" />
          </section>

          <CategorySeoSection categoryId="word" />

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">{t("privacyBadge")}</p>
            <Link
              href="/tools/"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToAllTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
