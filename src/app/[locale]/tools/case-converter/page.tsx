import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CaseConverterWorkspace } from "@/components/tools/productivity/CaseConverterWorkspace";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { routing } from "@/i18n/routing";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { notFound } from "next/navigation";

const SLUG = "case-converter";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CaseConverterPage" });
  const toolPath = resolveToolHref(SLUG);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}${toolPath}`,
      languages: Object.fromEntries(
        routing.locales.map((item) => [item, `/${item}${toolPath}`]),
      ),
    },
  };
}

export default async function CaseConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((entry) => entry.slug === SLUG);
  if (!tool) notFound();

  const t = await getTranslations("CaseConverterPage");
  const tPage = await getTranslations("ToolPage");

  const toolPath = resolveToolHref(SLUG);
  const pathname = `/${locale}${toolPath}`;
  const pageTitle = t("title");

  const crumbs = buildToolPageBreadcrumbs({
    slug: SLUG,
    toolTitle: pageTitle,
    toolPath,
    tPage,
  });

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
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <section className="border-b border-[#262626] pb-8" aria-label={pageTitle}>
            <h1 className="sr-only">{pageTitle}</h1>
            <CaseConverterWorkspace tool={tool} slug={SLUG} />
          </section>

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
