import type { Metadata } from "next";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolMarketingSections } from "@/components/layout/ToolMarketingSections";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { AppPageShell } from "@/components/AppPageShell";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";
import {
  buildLocalizedGuideParagraphs,
  getLocalizedToolFaqs,
  localizedToolTitle,
  translateToolIntent,
} from "@/lib/i18n-tool-page";
import {
  buildToolPageBreadcrumbs,
  resolveToolPageDescription,
} from "@/lib/tool-breadcrumb-hub";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildLocalizedToolMetadata, buildToolSeoCopy } from "@/lib/tool-seo";
import { resolveToolSeoPageOverride } from "@/lib/tool-seo-overrides";
import { productPageMainClassName, toolPageDashboardStack } from "@/lib/tool-ui";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const SLUG = "invoice-generator";

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

export default async function InvoiceGeneratorPage({ params }: PageProps) {
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
  const pageDescription = resolveToolPageDescription({
    title: pageHeadline,
    intent: subtitle,
    heroTagline: seoOverride?.heroTagline,
  });
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

  const crumbs = buildToolPageBreadcrumbs({
    slug: SLUG,
    toolTitle: pageHeadline,
    toolPath: pathname,
    seoCategory: tool.category,
    tPage,
  });
  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

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
          applicationCategory: "BusinessApplication",
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className={toolPageDashboardStack}>
          <ToolGlassProvider category={tool.category}>
            <ToolPageShellProvider
              headline={pageHeadline}
              subline={pageDescription ?? ""}
              slug={SLUG}
              stacked
            >
              <ToolLayout
                faqs={faqs}
                breadcrumbs={
                  <ToolBreadcrumbs tool={tool} category={tool.category} items={breadcrumbItems} />
                }
                belowTool={
                  <ToolPageDashboardSection className="mt-8">
                    <h2 className="text-lg font-semibold tracking-wide text-ink dark:text-white">
                      {tPage("invoiceTemplatesByProfession")}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
                      {tPage("invoiceTemplatesByProfessionHint")}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                      {INVOICE_TEMPLATE_PROFILES.map((profile) => (
                        <li key={profile.slug}>
                          <Link
                            href={`/templates/${profile.slug}/`}
                            className="tool-seo-workflow-links__link inline-flex"
                            prefetch={false}
                          >
                            {profile.professionLabel}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </ToolPageDashboardSection>
                }
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
                  <InvoiceGenerator />
                </WorkspaceUploadShell>
              </ToolLayout>
            </ToolPageShellProvider>
          </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}
