import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentVideoMp4BlogPosts } from "@/lib/blog-video-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import { buildMp4ToolGridItems, getMp4ToolFeatureLabels, MP4_TOOLS_HUB_PATH } from "@/lib/mp4-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Mp4ToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${MP4_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}${MP4_TOOLS_HUB_PATH}`])),
    },
  };
}

export default async function Mp4ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Mp4ToolsPage");
  const tPage = await getTranslations("ToolPage");
  const pathname = `/${locale}${MP4_TOOLS_HUB_PATH}`;
  const gridItems = buildMp4ToolGridItems(t);
  const featureList = getMp4ToolFeatureLabels(t);
  const relatedGuides = getRecentVideoMp4BlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("schemaName"), path: MP4_TOOLS_HUB_PATH },
  ];

  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <nav aria-label="Breadcrumb" className="tool-breadcrumbs mb-6">
            <ol className="tool-breadcrumbs__list">
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                return (
                  <li key={`${item.href}-${index}`} className="tool-breadcrumbs__item">
                    {isLast ? (
                      <span className="tool-breadcrumbs__current" aria-current="page">
                        {item.label}
                      </span>
                    ) : (
                      <>
                        <Link href={item.href} className="tool-breadcrumbs__link" prefetch={false}>
                          {item.label}
                        </Link>
                        <span className="tool-breadcrumbs__sep" aria-hidden="true">
                          /
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <header className="tools-directory-page__head">
            <h1 className="tools-directory-page__title">{t("title")}</h1>
            <p className="tools-directory-page__desc">{t("description")}</p>
          </header>

          <section
            className="tools-hub-panel border border-[#262626] bg-[#0a0a0a] p-6"
            aria-label={t("schemaName")}
          >
            <CategoryDirectoryFlatGrid items={gridItems} />
          </section>

          <ToolsHubRelatedGuides
            posts={relatedGuides}
            title={t("relatedGuidesTitle")}
            sectionId="mp4-tools-related-guides"
          />

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
            <Link
              href="/"
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
