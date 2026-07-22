import { AppPageShell } from "@/components/AppPageShell";
import { RelatedAudioTools } from "@/components/tools/RelatedAudioTools";
import { AudioToolMarketingSections } from "@/components/tools/AudioToolMarketingSections";
import { AudioToolWorkspace } from "@/components/tools/AudioToolWorkspace";
import { Mp4ToMp3IntroGate } from "@/components/Mp4ToMp3IntroGate";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolGlassProvider } from "@/context/ToolGlassContext";
import {
  buildLocalizedAudioGuideParagraphs,
  buildLocalizedAudioToolFaqs,
  resolveAudioToolSeoOverride,
} from "@/lib/audio-tool-page";
import {
  buildToolPageBreadcrumbs,
  resolveToolPageDescription,
} from "@/lib/tool-breadcrumb-hub";
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
  const pageDescription = resolveToolPageDescription({
    title: pageHeadline,
    intent: tool.title,
    heroTagline: seoOverride?.heroTagline,
  });
  const schemaDescription = seoOverride?.schemaDescription ?? tool.title;
  const faqs = buildLocalizedAudioToolFaqs(tPage, tool, pageHeadline);
  const paragraphs = buildLocalizedAudioGuideParagraphs(tPage, tool);
  const pathname = `/tools/${slug}/`;

  const crumbs = buildToolPageBreadcrumbs({
    slug,
    toolTitle: pageHeadline,
    toolPath: pathname,
    seoCategory: "optimize",
    tPage,
  });
  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

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
              subline={pageDescription ?? ""}
              slug={slug}
              stacked
            >
              <Mp4ToMp3IntroGate active={tool.id === "mp4-to-mp3"}>
              <ToolLayout
                faqs={faqs}
                feedbackTitle={pageHeadline}
                breadcrumbs={
                  <ToolBreadcrumbs
                    tool={{ slug, title: pageHeadline, category: "optimize" }}
                    category="optimize"
                    items={breadcrumbItems}
                  />
                }
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
                related={<RelatedAudioTools toolId={tool.id} />}
              >
                <AudioToolWorkspace toolId={tool.id} />
              </ToolLayout>
              </Mp4ToMp3IntroGate>
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
