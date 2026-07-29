import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentDeveloperSecurityBlogPosts } from "@/lib/blog-developer-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import {
  buildDeveloperHubGroupItems,
  DEVELOPER_HUB_TOOL_GROUPS,
  DEVELOPER_TOOLS_HUB_PATH,
  getDeveloperHubFeatureLabels,
  type DeveloperHubGroupId,
} from "@/lib/developer-tools-hub";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

const GROUP_TITLE_KEYS: Record<DeveloperHubGroupId, string> = {
  security: "groupSecurity",
  generation: "groupGeneration",
  utilities: "groupUtilities",
  more: "groupMore",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DeveloperToolsHubPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${DEVELOPER_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${DEVELOPER_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function DeveloperToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("DeveloperToolsHubPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const pathname = `/${locale}${DEVELOPER_TOOLS_HUB_PATH}`;
  const featureList = [
    t("groupSecurity"),
    t("groupGeneration"),
    t("groupUtilities"),
    ...getDeveloperHubFeatureLabels(tTools),
  ];
  const relatedGuides = getRecentDeveloperSecurityBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubDeveloper"), path: DEVELOPER_TOOLS_HUB_PATH },
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
          applicationCategory: "DeveloperApplication",
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--hub-split page-container">
          <CategoryHubPageHeader
            categoryId="developer"
            title={t("title", { count: getCategoryToolCount("developer") })}
            description={t("description")}
            footerNote={t("zeroServerPolicy")}
            variant="bordered"
          />
          <CategoryHubSplit
            content={
              <>
              <CategorySeoSection categoryId="developer" />

              <section
                          className="category-hub-split__related"
                          aria-labelledby="developer-tools-related-hubs"
                        >
                          <h2
                            id="developer-tools-related-hubs"
                            className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
                          >
                            {t("relatedHubsTitle")}
                          </h2>
                          <ul className="mt-4 flex flex-col gap-3">
                            <li className="border-b border-[#1a1a1a] pb-3">
                              <Link
                                href="/tools/json-tools/"
                                className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                                prefetch={false}
                              >
                                {t("exploreJsonTools")}
                              </Link>
                            </li>
                            <li className="border-b border-[#1a1a1a] pb-3">
                              <Link
                                href="/tools/text-tools/"
                                className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                                prefetch={false}
                              >
                                {t("exploreTextTools")}
                              </Link>
                            </li>
                            <li className="pb-0">
                              <Link
                                href="/tools/extract-tools/"
                                className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                                prefetch={false}
                              >
                                {t("exploreExtractTools")}
                              </Link>
                            </li>
                          </ul>
                        </section>

              <ToolsHubRelatedGuides
                          posts={relatedGuides}
                          title={t("relatedGuidesTitle")}
                          sectionId="developer-tools-related-guides"
                        />
              </>
            }
            tools={
              <>
              {DEVELOPER_HUB_TOOL_GROUPS.map((group) => (
                          <section
                            key={group.id}
                            className="tools-hub-panel category-hub-split__group"
                            aria-labelledby={`developer-group-${group.id}`}
                          >
                            <h2
                              id={`developer-group-${group.id}`}
                              className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
                            >
                              {t(GROUP_TITLE_KEYS[group.id])}
                            </h2>
                            <CategoryDirectoryFlatGrid
                              items={buildDeveloperHubGroupItems(group.id, tTools, locale)}
                              categoryId="developer"
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
