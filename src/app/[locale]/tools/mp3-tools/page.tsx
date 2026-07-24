import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { ToolsHubRelatedGuides } from "@/components/ToolsHubRelatedGuides";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRecentAudioMp3BlogPosts } from "@/lib/blog-audio-category";
import { getBlogRegistry } from "@/lib/blog-registry";
import { buildMp3ToolGridItems, getMp3ToolFeatureLabels, MP3_TOOLS_HUB_PATH } from "@/lib/mp3-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Mp3ToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${MP3_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}${MP3_TOOLS_HUB_PATH}`])),
    },
  };
}

export default async function Mp3ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Mp3ToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const pathname = `/${locale}${MP3_TOOLS_HUB_PATH}`;
  const gridItems = buildMp3ToolGridItems(tTools, locale);
  const featureList = getMp3ToolFeatureLabels(tTools);
  const relatedGuides = getRecentAudioMp3BlogPosts(getBlogRegistry(locale).blog || [], 3);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubMp3"), path: MP3_TOOLS_HUB_PATH },
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
            <CategoryDirectoryFlatGrid items={gridItems} categoryId="mp3" />
          </section>

          <CategorySeoSection categoryId="mp3" />

          <ToolsHubRelatedGuides
            posts={relatedGuides}
            title={t("relatedGuidesTitle")}
            sectionId="mp3-tools-related-guides"
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
