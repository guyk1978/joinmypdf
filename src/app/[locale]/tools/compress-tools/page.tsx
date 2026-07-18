import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentCompressionBlogPosts } from "@/lib/blog-compress-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import {
  buildCompressToolGroupItems,
  COMPRESS_TOOL_GROUPS,
  COMPRESS_TOOLS_HUB_PATH,
  getCompressToolFeatureLabels,
  type CompressToolGroupId,
} from "@/lib/compress-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

const GROUP_TITLE_KEYS: Record<CompressToolGroupId, string> = {
  image: "groupImage",
  media: "groupMedia",
  document: "groupDocument",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CompressToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${COMPRESS_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${COMPRESS_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function CompressToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("CompressToolsPage");
  const tTools = await getTranslations("Tools");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${COMPRESS_TOOLS_HUB_PATH}`;
  const featureList = getCompressToolFeatureLabels(t);
  const relatedGuides = getRecentCompressionBlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("schemaName"), path: COMPRESS_TOOLS_HUB_PATH },
  ];

  const whyCompressRows = [
    { format: t("whyCompress.rowImage.format"), reason: t("whyCompress.rowImage.reason") },
    { format: t("whyCompress.rowVideo.format"), reason: t("whyCompress.rowVideo.reason") },
    { format: t("whyCompress.rowAudio.format"), reason: t("whyCompress.rowAudio.reason") },
    { format: t("whyCompress.rowPdf.format"), reason: t("whyCompress.rowPdf.reason") },
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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-6 text-4xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          {COMPRESS_TOOL_GROUPS.map((group) => (
            <section
              key={group.id}
              className="tools-hub-panel border-b border-[#262626] py-8 first:pt-0"
              aria-labelledby={`compress-group-${group.id}`}
            >
              <h2
                id={`compress-group-${group.id}`}
                className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
              >
                {t(GROUP_TITLE_KEYS[group.id])}
              </h2>
              <CategoryDirectoryFlatGrid
                items={buildCompressToolGroupItems(group.id, tTools, locale)}
                categoryId="compress"
              />
            </section>
          ))}

          <CategorySeoSection categoryId="compress" />

          <section
            className="mt-10 border-t border-[#262626] pt-8"
            aria-labelledby="compress-why-heading"
          >
            <h2
              id="compress-why-heading"
              className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("whyCompress.title")}
            </h2>
            <p className="mt-3 mb-4 text-sm leading-relaxed text-[#a3a3a3]">{t("whyCompress.intro")}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#262626]">
                    <th className="py-2 pr-4 font-medium text-white">{t("whyCompress.colFormat")}</th>
                    <th className="py-2 font-medium text-white">{t("whyCompress.colWhy")}</th>
                  </tr>
                </thead>
                <tbody>
                  {whyCompressRows.map((row) => (
                    <tr key={row.format} className="border-b border-[#1a1a1a] last:border-b-0">
                      <td className="py-3 pr-4 align-top font-medium text-white">{row.format}</td>
                      <td className="py-3 align-top text-[#a3a3a3]">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="mt-10 border-t border-[#262626] pt-8"
            aria-labelledby="compress-tools-related-categories"
          >
            <h2
              id="compress-tools-related-categories"
              className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("relatedCategoriesTitle")}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="border-b border-[#1a1a1a] pb-3">
                <Link
                  href="/tools/image-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreImageTools")}
                </Link>
              </li>
              <li className="border-b border-[#1a1a1a] pb-3">
                <Link
                  href="/tools/mp4-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreVideoTools")}
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
            sectionId="compress-tools-related-guides"
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
