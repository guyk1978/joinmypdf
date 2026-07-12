import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
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

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${DEVELOPER_TOOLS_HUB_PATH}`,
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
  const pathname = `/${locale}${DEVELOPER_TOOLS_HUB_PATH}`;
  const featureList = getDeveloperHubFeatureLabels(t);
  const relatedGuides = getRecentDeveloperSecurityBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("title"), path: DEVELOPER_TOOLS_HUB_PATH },
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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-6 text-4xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
            <p className="mt-4 mb-0 text-xs uppercase tracking-widest text-[#737373]">{t("zeroServerPolicy")}</p>
          </header>

          {DEVELOPER_HUB_TOOL_GROUPS.map((group) => (
            <section
              key={group.id}
              className="tools-hub-panel border-b border-[#262626] py-8 first:pt-0"
              aria-labelledby={`developer-group-${group.id}`}
            >
              <h2
                id={`developer-group-${group.id}`}
                className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
              >
                {t(GROUP_TITLE_KEYS[group.id])}
              </h2>
              <CategoryDirectoryFlatGrid items={buildDeveloperHubGroupItems(group.id, t)} />
            </section>
          ))}

          <section
            className="mt-10 border-t border-[#262626] pt-8"
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
