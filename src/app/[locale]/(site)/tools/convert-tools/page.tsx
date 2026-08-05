import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { CategoryHubPageHeader } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentConversionBlogPosts } from "@/lib/blog-convert-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import {
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
  data: "groupData",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ConvertToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${CONVERT_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
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
  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${CONVERT_TOOLS_HUB_PATH}`;
  const featureList = getConvertToolFeatureLabels(t);
  const relatedGuides = getRecentConversionBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("schemaName"), path: CONVERT_TOOLS_HUB_PATH },
  ];

  const convertGroups = CONVERT_TOOL_GROUPS.map((group) => ({
    id: group.id,
    titleKey: GROUP_TITLE_KEYS[group.id],
    items: buildConvertToolGroupItems(group.id, tTools, locale),
  })).filter((group) => group.items.length > 0);

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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--hub-split page-container">
          <CategoryHubPageHeader
            categoryId="convert"
            title={t("panelTitle")}
            description={t("description")}
            variant="bordered"
          />
          <CategoryHubSplit
            content={
              <>
                <CategorySeoSection categoryId="convert" />

                <section
                  className="category-hub-split__related"
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
              </>
            }
            tools={
              <>
                {convertGroups.map((group) => (
                  <section
                    key={group.id}
                    className="tools-hub-panel convert-tools-panel category-hub-split__group"
                    aria-labelledby={`convert-group-${group.id}`}
                  >
                    <h2
                      id={`convert-group-${group.id}`}
                      className="convert-tools-panel__group-title"
                    >
                      {t(group.titleKey)}
                      <span className="convert-tools-panel__group-count" aria-hidden="true">
                        {group.items.length}
                      </span>
                    </h2>
                    <CategoryDirectoryFlatGrid
                      items={group.items}
                      categoryId="convert"
                    />
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
