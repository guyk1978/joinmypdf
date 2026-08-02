import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { PdfToolsCardGrid } from "@/components/PdfToolsCardGrid";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentPdfBlogPosts } from "@/lib/blog-pdf-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import {
  buildPdfToolGroupItems,
  getPdfToolFeatureLabels,
  PDF_TOOL_GROUPS,
  PDF_TOOLS_HUB_PATH,
  type PdfToolGroupId,
} from "@/lib/pdf-tools-hub";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

const GROUP_TITLE_KEYS: Record<PdfToolGroupId, string> = {
  mergeSplit: "groupMergeSplit",
  conversion: "groupConversion",
  compression: "groupCompression",
  securityUtilities: "groupSecurityUtilities",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PdfToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${PDF_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${PDF_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function PdfToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PdfToolsPage");
  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${PDF_TOOLS_HUB_PATH}`;
  const featureList = getPdfToolFeatureLabels(t);
  const relatedGuides = getRecentPdfBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("schemaName"), path: PDF_TOOLS_HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={webApplicationLd({
          name: t("schemaName"),
          description: t("schemaDescription"),
          pathname,
          locale,
          featureList,
          applicationCategory: "BusinessApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--hub-split page-container">
          <CategoryHubPageHeader
            categoryId="pdf"
            title={t("title", { count: getCategoryToolCount("pdf") })}
            description={t("description")}
            footerNote={t("privacyBadge")}
            variant="bordered"
          />

          {/*
            Shared hub layout: tool grids directly under the hero,
            then About / FAQ / related content stacked below.
          */}
          <CategoryHubSplit
            content={
              <>
              <CategorySeoSection categoryId="pdf" />

              <section
                className="category-hub-split__related"
                aria-labelledby="pdf-tools-related-hubs"
              >
                <h2
                  id="pdf-tools-related-hubs"
                  className="tools-hub-link-list__title"
                >
                  {t("relatedHubsTitle")}
                </h2>
                <ul className="tools-hub-link-list">
                  <li className="tools-hub-link-list__item">
                    <Link
                      href="/tools/convert-tools/"
                      className="tools-hub-link-list__link"
                      prefetch={false}
                    >
                      <span className="tools-hub-link-list__label">
                        {t("exploreConvertTools")}
                      </span>
                    </Link>
                  </li>
                  <li className="tools-hub-link-list__item">
                    <Link
                      href="/tools/compress-tools/"
                      className="tools-hub-link-list__link"
                      prefetch={false}
                    >
                      <span className="tools-hub-link-list__label">
                        {t("exploreCompressTools")}
                      </span>
                    </Link>
                  </li>
                  <li className="tools-hub-link-list__item">
                    <Link
                      href="/tools/extract-tools/"
                      className="tools-hub-link-list__link"
                      prefetch={false}
                    >
                      <span className="tools-hub-link-list__label">
                        {t("exploreExtractTools")}
                      </span>
                    </Link>
                  </li>
                </ul>
              </section>

              <ToolsHubRelatedGuides
                posts={relatedGuides}
                title={t("relatedGuidesTitle")}
                sectionId="pdf-tools-related-guides"
              />
            </>
            }
            tools={
              <>
              {PDF_TOOL_GROUPS.map((group) => (
                <section
                  key={group.id}
                  className="tools-hub-panel category-hub-split__group"
                  aria-labelledby={`pdf-group-${group.id}`}
                >
                  <h2
                    id={`pdf-group-${group.id}`}
                    className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
                  >
                    {t(GROUP_TITLE_KEYS[group.id])}
                  </h2>
                  <PdfToolsCardGrid items={buildPdfToolGroupItems(group.id, tTools, locale)} />
                </section>
              ))}
            </>
            }
          />

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
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
