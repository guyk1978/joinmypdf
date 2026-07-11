import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentConversionBlogPosts } from "@/lib/blog-convert-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import {
  buildConvertPopularItems,
  buildConvertToolGroupItems,
  CONVERT_TOOL_GROUPS,
  CONVERT_TOOLS_HUB_PATH,
  getConvertToolFeatureLabels,
  type ConvertToolGroupId,
} from "@/lib/convert-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

const GROUP_TITLE_KEYS: Record<ConvertToolGroupId, string> = {
  document: "groupDocument",
  image: "groupImage",
  media: "groupMedia",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ConvertToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${CONVERT_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${CONVERT_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function ConvertToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ConvertToolsPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${CONVERT_TOOLS_HUB_PATH}`;
  const featureList = getConvertToolFeatureLabels(t);
  const relatedGuides = getRecentConversionBlogPosts(getBlogRegistry(locale).blog || [], 3);
  const popularItems = buildConvertPopularItems(t);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("title"), path: CONVERT_TOOLS_HUB_PATH },
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
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-6 text-4xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          <section
            className="tools-hub-panel border-b border-[#262626] pb-8"
            aria-labelledby="convert-popular-heading"
          >
            <h2
              id="convert-popular-heading"
              className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("popularTitle")}
            </h2>
            <CategoryDirectoryFlatGrid items={popularItems} />
          </section>

          {CONVERT_TOOL_GROUPS.map((group) => (
            <section
              key={group.id}
              className="tools-hub-panel border-b border-[#262626] py-8"
              aria-labelledby={`convert-group-${group.id}`}
            >
              <h2
                id={`convert-group-${group.id}`}
                className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
              >
                {t(GROUP_TITLE_KEYS[group.id])}
              </h2>
              <CategoryDirectoryFlatGrid items={buildConvertToolGroupItems(group.id, t)} />
            </section>
          ))}

          <section
            className="mt-10 border-t border-[#262626] pt-8"
            aria-labelledby="convert-tools-related-categories"
          >
            <h2
              id="convert-tools-related-categories"
              className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("relatedCategoriesTitle")}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="border-b border-[#1a1a1a] pb-3">
                <Link
                  href="/tools/compress-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreCompressTools")}
                </Link>
              </li>
              <li className="border-b border-[#1a1a1a] pb-3">
                <Link
                  href="/tools/extract-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreExtractTools")}
                </Link>
              </li>
              <li className="pb-0">
                <Link
                  href="/tools/pdf-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("explorePdfTools")}
                </Link>
              </li>
            </ul>
          </section>

          <ToolsHubRelatedGuides
            posts={relatedGuides}
            title={t("relatedGuidesTitle")}
            sectionId="convert-tools-related-guides"
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
