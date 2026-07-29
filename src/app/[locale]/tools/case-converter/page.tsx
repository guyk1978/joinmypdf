import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { CaseConverterWorkspace } from "@/components/tools/productivity/CaseConverterWorkspace";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { routing } from "@/i18n/routing";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd, faqLd } from "@/lib/schema";
import { productPageMainClassName } from "@/lib/tool-ui";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { notFound } from "next/navigation";
import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";

const SLUG = "case-converter";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CaseConverterPage" });
  const toolPath = resolveToolHref(SLUG);

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}${toolPath}`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
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
  const faqs = getLocalizedToolFaqs(tPage, tool, null, pageTitle, locale);

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
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page page-container">
          <section className="border-b border-[#262626] pb-8" aria-label={pageTitle}>
            <h1 className="sr-only">{pageTitle}</h1>
              <CaseConverterWorkspace tool={tool} slug={SLUG} />
          </section>
        </div>
      </AppPageShell>
    </>
  );
}
