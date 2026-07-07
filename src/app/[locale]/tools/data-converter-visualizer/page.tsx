import type { Metadata } from "next";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolMarketingSections } from "@/components/layout/ToolMarketingSections";
import { AppPageShell } from "@/components/AppPageShell";
import { DataToolDashboard } from "@/components/data-tool/DataToolDashboard";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import {
  buildLocalizedGuideParagraphs,
  getLocalizedToolFaqs,
  localizedToolTitle,
  translateToolIntent,
} from "@/lib/i18n-tool-page";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildLocalizedToolMetadata, buildToolSeoCopy } from "@/lib/tool-seo";
import { resolveToolSeoPageOverride } from "@/lib/tool-seo-overrides";
import { productPageMainClassName, toolPageDashboardStack } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const SLUG = "data-converter-visualizer";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const tool = registry.tools.find((item) => item.slug === SLUG);
  if (!tool) return {};

  const tTools = await getTranslations({ locale, namespace: "Tools" });
  const tPage = await getTranslations({ locale, namespace: "ToolPage" });

  return buildLocalizedToolMetadata({
    tool,
    variant: null,
    slug: SLUG,
    locale,
    tTools,
    tPage,
  });
}

export default async function DataConverterVisualizerPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tool = registry.tools.find((item) => item.slug === SLUG);
  if (!tool) notFound();

  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");

  const displayTitle = localizedToolTitle(tTools, tool, null);
  const subtitle = translateToolIntent(tTools, tool.slug, tool.intent);
  const seoOverride = resolveToolSeoPageOverride(tool, null, tPage);
  const pageHeadline = seoOverride?.h1 ?? displayTitle;
  const faqs = getLocalizedToolFaqs(tPage, tool, null, pageHeadline, locale);
  const { description } = buildToolSeoCopy({
    tool,
    variant: null,
    locale,
    tTools,
    tPage,
  });
  const pathname = `/tools/${SLUG}/`;
  const paragraphs = buildLocalizedGuideParagraphs(tPage, tool, null);
  const schemaDescription = seoOverride?.schemaDescription ?? description;
  const schemaName = seoOverride?.h1 ?? displayTitle;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: displayTitle, path: pathname },
  ];

  return (
    <>
      <JsonLd
        data={softwareApplicationLd({
          tool,
          variant: null,
          pathname,
          description: schemaDescription,
          locale,
          name: schemaName,
          operatingSystem: "Web Browser",
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className={toolPageDashboardStack}>
          <ToolGlassProvider category={tool.category}>
            <ToolPageShellProvider
              headline={pageHeadline}
              subline={subtitle}
              tagline={seoOverride?.heroTagline}
              slug={SLUG}
              stacked
            >
              <ToolLayout
                faqs={faqs}
                marketing={
                  <ToolMarketingSections
                    tool={tool}
                    paragraphs={paragraphs}
                    articles={[]}
                    seoOverride={seoOverride}
                    beforeYouStartTitle={seoOverride?.introSectionTitle ?? tPage("beforeYouStart")}
                    whySectionTitle={seoOverride?.whySectionTitle ?? tPage("whyChooseLocalProcessing")}
                    whySectionSubheadline={seoOverride?.whySectionSubheadline}
                    whyBenefits={seoOverride?.whyBenefits}
                    relatedGuidesTitle={tPage("relatedGuides")}
                    tPage={tPage}
                  />
                }
              >
                <WorkspaceUploadShell>
                  <DataToolDashboard />
                </WorkspaceUploadShell>
              </ToolLayout>
            </ToolPageShellProvider>
          </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}
