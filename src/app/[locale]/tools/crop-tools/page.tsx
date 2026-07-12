import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildCropToolGridItems,
  CROP_TOOLS_HUB_PATH,
  getCropToolFeatureLabels,
} from "@/lib/crop-tools";
import { PDF_TOOLS_HUB_PATH } from "@/lib/pdf-tools-hub";
import { breadcrumbLd, JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CropToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${CROP_TOOLS_HUB_PATH}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${CROP_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function CropToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("CropToolsPage");
  const tPage = await getTranslations("ToolPage");
  const gridItems = buildCropToolGridItems(t);
  const featureList = getCropToolFeatureLabels(t);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: t("title"), path: CROP_TOOLS_HUB_PATH },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("schemaName"),
          description: t("schemaDescription"),
          url: absoluteUrl(`/${locale}${CROP_TOOLS_HUB_PATH}`),
          numberOfItems: gridItems.length,
          about: featureList,
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-4 text-3xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          <section className="tools-hub-panel border-b border-[#262626] pb-8" aria-label={t("schemaName")}>
            <CategoryDirectoryFlatGrid items={gridItems} />
          </section>

          <footer className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="m-0 text-xs uppercase tracking-widest text-[#737373]">{t("privacyBadge")}</p>
            <Link
              href={PDF_TOOLS_HUB_PATH}
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToPdfTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
