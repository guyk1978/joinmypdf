import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildNetworkToolGridItems,
  getNetworkToolFeatureLabels,
  NETWORK_TOOLS_HUB_PATH,
} from "@/lib/network-tools-hub";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NetworkToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${NETWORK_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${NETWORK_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function NetworkToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("NetworkToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const pathname = `/${locale}${NETWORK_TOOLS_HUB_PATH}`;
  const gridItems = buildNetworkToolGridItems(tTools, locale);
  const featureList = getNetworkToolFeatureLabels(tTools);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: tPage("breadcrumbHubNetwork"), path: NETWORK_TOOLS_HUB_PATH },
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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <CategoryHubPageHeader
            categoryId="network"
            title={t("title", { count: getCategoryToolCount("network") })}
            description={t("description")}
            variant="bordered"
          />

          <section className="tools-hub-panel border-b border-[#262626] pb-8" aria-label={t("schemaName")}>
            <CategoryDirectoryFlatGrid items={gridItems} categoryId="network" />
          </section>

          <article className="border-b border-[#262626] py-10" aria-labelledby="network-tools-intro">
            <h2
              id="network-tools-intro"
              className="mb-4 text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              {t("introHeading")}
            </h2>
            <p className="mb-4 max-w-3xl text-base leading-relaxed text-[#a3a3a3]">{t("introP1")}</p>
            <p className="m-0 max-w-3xl text-base leading-relaxed text-[#a3a3a3]">{t("introP2")}</p>
          </article>

          <CategorySeoSection categoryId="network" />

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
            <Link
              href="/tools/developer-tools/"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("relatedDeveloperTools")}
            </Link>
          </footer>
        </div>
      </AppPageShell>
    </>
  );
}
