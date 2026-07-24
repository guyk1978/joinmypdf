import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentImagePngBlogPosts } from "@/lib/blog-image-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import { buildPngToolGridItems, getPngToolFeatureLabels, PNG_TOOLS_HUB_PATH } from "@/lib/png-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PngToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${PNG_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}${PNG_TOOLS_HUB_PATH}`])),
    },
  };
}

export default async function PngToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PngToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const pathname = `/${locale}${PNG_TOOLS_HUB_PATH}`;
  const gridItems = buildPngToolGridItems(tTools, locale);
  const featureList = getPngToolFeatureLabels(tTools);
  const relatedGuides = getRecentImagePngBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubPng"), path: PNG_TOOLS_HUB_PATH },
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
          applicationCategory: "MultimediaApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <header className="tools-directory-page__head">
            <h1 className="tools-directory-page__title">{t("title")}</h1>
            <p className="tools-directory-page__desc">{t("description")}</p>
          </header>

          <section
            className="tools-hub-panel p-0"
            aria-label={t("schemaName")}
          >
            <CategoryDirectoryFlatGrid items={gridItems} categoryId="png" />
          </section>

          <CategorySeoSection categoryId="png" />

          <section
            className="mt-10 border-t border-[#262626] pt-8"
            aria-labelledby="png-tools-related-formats"
          >
            <h2
              id="png-tools-related-formats"
              className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("relatedFormatsTitle")}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="border-b border-[#1a1a1a] pb-3">
                <Link
                  href="/tools/jpg-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreJpgTools")}
                </Link>
              </li>
              <li className="pb-0">
                <Link
                  href="/tools/image-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreImageTools")}
                </Link>
              </li>
            </ul>
          </section>

          <ToolsHubRelatedGuides
            posts={relatedGuides}
            title={t("relatedGuidesTitle")}
            sectionId="png-tools-related-guides"
          />

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
            <Link
              href="/home"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToHome")}
            </Link>
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
