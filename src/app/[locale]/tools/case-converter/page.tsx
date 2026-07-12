import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { CaseConverter } from "@/components/tools/CaseConverter";
import { routing } from "@/i18n/routing";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";

const SLUG = "case-converter";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CaseConverterPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/tools/${SLUG}/`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}/tools/${SLUG}/`])),
    },
  };
}

export default async function CaseConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("CaseConverterPage");
  const tPage = await getTranslations("ToolPage");

  const pathname = `/${locale}/tools/${SLUG}/`;
  const pageTitle = t("title");

  const crumbs = buildToolPageBreadcrumbs({
    slug: SLUG,
    toolTitle: pageTitle,
    toolPath: `/tools/${SLUG}/`,
    tPage,
  });

  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

  const featureList = [
    t("schemaFeatureUppercase"),
    t("schemaFeatureLowercase"),
    t("schemaFeatureTitleCase"),
    t("schemaFeatureCamelCase"),
    t("schemaFeatureSnakeCase"),
    t("schemaFeatureKebabCase"),
    t("schemaFeatureCopy"),
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
        })}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="tool-page-layout__breadcrumbs">
            <ToolBreadcrumbs
              tool={{ slug: SLUG, title: pageTitle, category: "convert" }}
              category="convert"
              items={breadcrumbItems}
            />
          </div>

          <header className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{pageTitle}</h1>
          </header>

          <div className="mt-6">
            <CaseConverter className="max-w-none" placeholder={t("placeholder")} />
          </div>

          <section className="mt-10 border-t border-[#262626] pt-8" aria-labelledby="case-converter-info">
            <h2 id="case-converter-info" className="text-sm font-semibold uppercase tracking-widest text-[#a3a3a3]">
              {t("infoTitle")}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#a3a3a3] md:text-base">{t("infoCamelSnake")}</p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#a3a3a3] md:text-base">{t("infoPrivacy")}</p>
          </section>
        </div>
      </AppPageShell>
    </>
  );
}
