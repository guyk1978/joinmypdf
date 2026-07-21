import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolMarketingSections } from "@/components/layout/ToolMarketingSections";
import { RelatedTools } from "@/components/RelatedTools";
import { CaseConverterWorkspace } from "@/components/tools/productivity/CaseConverterWorkspace";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import {
  buildLocalizedGuideParagraphs,
  getLocalizedToolFaqs,
} from "@/lib/i18n-tool-page";
import { buildToolPageBreadcrumbs } from "@/lib/tool-breadcrumb-hub";
import { routing } from "@/i18n/routing";
import { registry } from "@/lib/registry";
import { breadcrumbLd, JsonLd, webApplicationLd, faqLd } from "@/lib/schema";
import { productPageMainClassName, toolPageDashboardStack } from "@/lib/tool-ui";
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
  const pageDescription = t("metaDescription");
  const faqs = getLocalizedToolFaqs(tPage, tool, null, pageTitle, locale);
  const paragraphs = [
    ...buildLocalizedGuideParagraphs(tPage, tool, null),
    t("infoCamelSnake"),
    t("infoPrivacy"),
  ];

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
        <div className={toolPageDashboardStack}>
          <ToolGlassProvider category={tool.category}>
            <ToolPageShellProvider
              headline={pageTitle}
              subline={pageDescription}
              slug={SLUG}
              stacked
            >
              <ToolLayout
                faqs={faqs}
                feedbackTitle={pageTitle}
                marketing={
                  <ToolMarketingSections
                    tool={tool}
                    paragraphs={paragraphs}
                    articles={[]}
                    seoOverride={null}
                    beforeYouStartTitle={t("infoTitle")}
                    whySectionTitle={tPage("whyChooseLocalProcessing")}
                    relatedGuidesTitle={tPage("relatedGuides")}
                    tPage={tPage}
                  />
                }
                related={<RelatedTools tool={tool} />}
              >
                <CaseConverterWorkspace tool={tool} slug={SLUG} />
              </ToolLayout>
            </ToolPageShellProvider>
          </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}
