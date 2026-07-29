import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategoryHubPageHeader, getCategoryToolCount } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildXmlToolGridItems,
  getXmlToolFeatureLabels,
  XML_TOOLS_HUB_PATH,
} from "@/lib/xml-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "XmlToolsPage" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${XML_TOOLS_HUB_PATH}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${XML_TOOLS_HUB_PATH}`]),
      ),
    },
  };
}

export default async function XmlToolsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("XmlToolsPage");
  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");
  const pathname = `/${locale}${XML_TOOLS_HUB_PATH}`;
  const gridItems = buildXmlToolGridItems(tTools);
  const featureList = getXmlToolFeatureLabels(t);

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbHubDeveloper"), path: "/tools/developer-tools/" },
    { name: t("title"), path: XML_TOOLS_HUB_PATH },
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
            categoryId="xml"
            title={t("title", { count: getCategoryToolCount("xml") })}
            description={t("description")}
            variant="bordered"
          />

          <CategoryHubSplit
            content={
              <>
                <CategorySeoSection categoryId="xml" />
                <section
                  className="category-hub-split__related"
                  aria-labelledby="xml-tools-related-formats"
                >
                  <h2
                    id="xml-tools-related-formats"
                    className="tools-hub-link-list__title"
                  >
                    {t("relatedFormatsTitle")}
                  </h2>
                  <ul className="tools-hub-link-list">
                    <li className="tools-hub-link-list__item">
                      <Link
                        href="/tools/json-tools/"
                        className="tools-hub-link-list__link"
                        prefetch={false}
                      >
                        <span className="tools-hub-link-list__label">
                          {t("exploreJsonTools")}
                        </span>
                      </Link>
                    </li>
                    <li className="tools-hub-link-list__item">
                      <Link
                        href="/tools/yaml-tools/"
                        className="tools-hub-link-list__link"
                        prefetch={false}
                      >
                        <span className="tools-hub-link-list__label">
                          {t("exploreYamlTools")}
                        </span>
                      </Link>
                    </li>
                  </ul>
                  <p className="mt-4 mb-0 text-sm leading-relaxed text-[#a3a3a3]">
                    {t("relatedFormatsBlurb")}
                  </p>
                </section>
              </>
            }
            tools={
              <section
                className="tools-hub-panel category-hub-split__group"
                aria-label={t("schemaName")}
              >
                <CategoryDirectoryFlatGrid items={gridItems} categoryId="xml" />
              </section>
            }
          />

          <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#262626] pt-6">
            <Link
              href="/tools/developer-tools/"
              className="text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white"
              prefetch={false}
            >
              {t("backToDeveloperTools")}
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
