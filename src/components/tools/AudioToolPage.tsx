import { AppPageShell } from "@/components/AppPageShell";
import { AudioToolMarketingSections } from "@/components/tools/AudioToolMarketingSections";
import { AudioToolWorkspace } from "@/components/tools/AudioToolWorkspace";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import {
  buildLocalizedAudioGuideParagraphs,
  buildLocalizedAudioToolFaqs,
  resolveAudioToolSeoOverride,
} from "@/lib/audio-tool-page";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildToolAlternateLanguages } from "@/lib/tool-seo";
import type { ToolListEntry } from "@/lib/tool-module";
import type { ToolDefinition } from "@/lib/types";
import { productPageMainClassName, toolPageDashboardStack } from "@/lib/tool-ui";
import { getTranslations } from "next-intl/server";

type AudioToolPageProps = {
  tool: ToolListEntry;
  slug: string;
  locale: string;
};

function toSchemaTool(tool: ToolListEntry, title: string, description: string): ToolDefinition {
  return {
    slug: tool.id,
    category: "optimize",
    operation: tool.id,
    title,
    primaryKeyword: tool.name,
    intent: tool.title,
    description,
  };
}

export async function AudioToolPage({ tool, slug, locale }: AudioToolPageProps) {
  const tPage = await getTranslations("ToolPage");
  const seoOverride = resolveAudioToolSeoOverride(tool, tPage);
  const pageHeadline = seoOverride?.h1 ?? tool.name;
  const pageTagline = seoOverride?.heroTagline ?? tool.title;
  const schemaDescription = seoOverride?.schemaDescription ?? tool.title;
  const faqs = buildLocalizedAudioToolFaqs(tPage, tool, pageHeadline);
  const paragraphs = buildLocalizedAudioGuideParagraphs(tPage, tool);
  const pathname = `/tools/${slug}/`;

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: pageHeadline, path: pathname },
  ];

  return (
    <>
      <JsonLd
        data={softwareApplicationLd({
          tool: toSchemaTool(tool, pageHeadline, schemaDescription),
          variant: null,
          pathname,
          description: schemaDescription,
          locale,
          name: pageHeadline,
          operatingSystem: "Web Browser",
          applicationCategory: "UtilitiesApplication",
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className={toolPageDashboardStack}>
          <ToolGlassProvider category="optimize">
            <ToolPageShellProvider
              headline={pageHeadline}
              subline={pageTagline}
              tagline={seoOverride?.heroTagline}
              slug={slug}
              stacked
            >
              <ToolLayout
                faqs={faqs}
                feedbackTitle={pageHeadline}
                marketing={
                  <AudioToolMarketingSections
                    tool={tool}
                    paragraphs={paragraphs}
                    seoOverride={seoOverride}
                    beforeYouStartTitle={seoOverride?.introSectionTitle ?? tPage("beforeYouStart")}
                    whySectionTitle={seoOverride?.whySectionTitle ?? tPage("whyChooseLocalProcessing")}
                    whySectionSubheadline={seoOverride?.whySectionSubheadline}
                    whyBenefits={seoOverride?.whyBenefits}
                  />
                }
              >
                <AudioToolWorkspace toolId={tool.id} />
              </ToolLayout>
            </ToolPageShellProvider>
          </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}

export function buildAudioToolMetadata(
  tool: ToolListEntry,
  locale: string,
  tPage: Awaited<ReturnType<typeof getTranslations<"ToolPage">>>,
) {
  const seoOverride = resolveAudioToolSeoOverride(tool, tPage);
  const title = seoOverride?.h1 ?? tool.name;
  const description = seoOverride?.schemaDescription ?? tool.title;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/tools/${tool.id}/`,
      languages: buildToolAlternateLanguages(tool.id),
    },
  };
}
