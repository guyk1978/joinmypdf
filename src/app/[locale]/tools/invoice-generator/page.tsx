import type { Metadata } from "next";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolBeforeYouStart } from "@/components/ToolBeforeYouStart";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { ToolPageInfoBlock } from "@/components/ToolPageInfoBlock";
import { RelatedTools } from "@/components/RelatedTools";
import { AppPageShell } from "@/components/AppPageShell";
import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { InvoiceGenerator } from "@/components/invoice/InvoiceGenerator";
import { INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";
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
import { productPageMainClassName, toolPageDashboardStack, toolPageInfoWidth } from "@/lib/tool-ui";
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
              subline={subtitle}
              tagline={seoOverride?.heroTagline}
              slug={SLUG}
              stacked
            >
              <WorkspaceUploadShell>
                <InvoiceGenerator />
              </WorkspaceUploadShell>
            </ToolPageShellProvider>

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

            <ToolPageInfoBlock className={toolPageInfoWidth}>
              <ToolPageDashboardSection>
                <ToolBeforeYouStart title={seoOverride?.introSectionTitle ?? tPage("beforeYouStart")}>
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </ToolBeforeYouStart>
              </ToolPageDashboardSection>

              <LocalProcessingInfographic
                layout="dashboard"
                headline={seoOverride?.whySectionTitle ?? tPage("whyChooseLocalProcessing")}
                subheadline={seoOverride?.whySectionSubheadline}
                benefits={seoOverride?.whyBenefits}
              />

              <RelatedTools tool={tool} />

              <ToolPageDashboardSection aria-labelledby="tool-faq-heading">
                <h2
                  id="tool-faq-heading"
                  className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
                >
                  {tPage("questions")}
                </h2>
                <div className="tool-page-faq-list">
                  {faqs.map((f) => (
                    <details key={f.q} className="tool-page-faq-item">
                      <summary className="cursor-pointer text-ink dark:text-white">{f.q}</summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              </ToolPageDashboardSection>

              {seoOverride?.featuredGuide ? (
                <ToolPageDashboardSection>
                  <Link
                    href={`/blog/${seoOverride.featuredGuide.slug}/`}
                    className="text-base leading-relaxed text-neutral-300 hover:underline"
                    prefetch={false}
                  >
                    {seoOverride.featuredGuide.label}
                  </Link>
                </ToolPageDashboardSection>
              ) : null}

              {seoOverride?.relatedWorkflowLinks ? (
                <ToolPageDashboardSection>
                  <p className="mb-3 text-base leading-relaxed text-neutral-400">
                    {seoOverride.relatedWorkflowLinks.prompt}
                  </p>
                  <div className="tool-seo-workflow-links">
                    {seoOverride.relatedWorkflowLinks.links.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="tool-seo-workflow-links__link"
                        prefetch={false}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </ToolPageDashboardSection>
              ) : null}
            </ToolPageInfoBlock>
          </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}
