import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildExcelToolGridItems,
  EXCEL_TOOLS_HUB_PATH,
  getExcelToolFeatureLabels,
} from "@/lib/excel-tools";
import { breadcrumbLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ExcelToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${EXCEL_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${EXCEL_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function ExcelToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ExcelToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const gridItems = buildExcelToolGridItems(tTools, locale);
  const featureList = getExcelToolFeatureLabels(tTools);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubExcel"), path: EXCEL_TOOLS_HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("schemaName"),
          description: t("schemaDescription"),
          url: absoluteUrl(`/${locale}${EXCEL_TOOLS_HUB_PATH}`),
          numberOfItems: gridItems.length,
          about: featureList,
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--hub-split page-container">
          <CategoryHubPageHeader
            categoryId="excel"
            title={t("title", { count: getCategoryToolCount("excel") })}
            description={t("description")}
            variant="bordered"
          />
          <CategoryHubSplit
            content={
              <>
              <CategorySeoSection categoryId="excel" />
              </>
            }
            tools={
              <>
              <section className="tools-hub-panel category-hub-split__group" aria-label={t("schemaName")}>
                          <CategoryDirectoryFlatGrid items={gridItems} categoryId="excel" />
                        </section>
              </>
            }
          />

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
