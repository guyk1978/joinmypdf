import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getXmlToolFeatureLabels, XML_TOOLS_HUB_PATH } from "@/lib/xml-tools";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "XmlToolsPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${XML_TOOLS_HUB_PATH}`,
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
  const pathname = `/${locale}${XML_TOOLS_HUB_PATH}`;
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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page mx-auto w-full max-w-7xl px-4 md:px-6">
          <header className="mb-6 border-b border-[#262626] pb-6">
            <h1 className="mb-6 text-4xl font-bold text-white">{t("title")}</h1>
            <p className="m-0 text-base leading-relaxed text-[#a3a3a3]">{t("description")}</p>
          </header>

          <section
            className="mt-10 border-t border-[#262626] pt-8"
            aria-labelledby="xml-tools-related-formats"
          >
            <h2
              id="xml-tools-related-formats"
              className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("relatedFormatsTitle")}
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
              <li className="pb-0">
                <Link
                  href="/tools/yaml-tools/"
                  className="text-base font-medium text-white transition-colors hover:text-[#d4d4d4]"
                  prefetch={false}
                >
                  {t("exploreYamlTools")}
                </Link>
              </li>
            </ul>
            <p className="mt-4 mb-0 text-sm leading-relaxed text-[#a3a3a3]">{t("relatedFormatsBlurb")}</p>
          </section>

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
