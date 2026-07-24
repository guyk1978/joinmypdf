import { AppPageShell } from "@/components/AppPageShell";
import { RelatedAudioTools } from "@/components/tools/RelatedAudioTools";
import { AudioToolMarketingSections } from "@/components/tools/AudioToolMarketingSections";
import { AudioToolWorkspace } from "@/components/tools/AudioToolWorkspace";
import { Mp4ToMp3IntroGate } from "@/components/Mp4ToMp3IntroGate";
import { AudioCompressorIntroGate } from "@/components/AudioCompressorIntroGate";
import { Mp3CompressorIntroGate } from "@/components/Mp3CompressorIntroGate";
import { AudioMergerIntroGate } from "@/components/AudioMergerIntroGate";
import { AudioNormalizerIntroGate } from "@/components/AudioNormalizerIntroGate";
import { FadeInOutCreatorIntroGate } from "@/components/FadeInOutCreatorIntroGate";
import { FlacConverterIntroGate } from "@/components/FlacConverterIntroGate";
import { M4aConverterIntroGate } from "@/components/M4aConverterIntroGate";
import { Mp3ConverterIntroGate } from "@/components/Mp3ConverterIntroGate";
import { Mp3MetadataEditorIntroGate } from "@/components/Mp3MetadataEditorIntroGate";
import { AudioSpeedChangerIntroGate } from "@/components/AudioSpeedChangerIntroGate";
import { Mp3ToMp4IntroGate } from "@/components/Mp3ToMp4IntroGate";
import { Mp3ToWavIntroGate } from "@/components/Mp3ToWavIntroGate";
import { Mp3TrimmerIntroGate } from "@/components/Mp3TrimmerIntroGate";
import { Mp3VolumeBoosterIntroGate } from "@/components/Mp3VolumeBoosterIntroGate";
import { OggConverterIntroGate } from "@/components/OggConverterIntroGate";
import { SilenceRemoverIntroGate } from "@/components/SilenceRemoverIntroGate";
import { VoiceRemoverIntroGate } from "@/components/VoiceRemoverIntroGate";
import { WavToMp3IntroGate } from "@/components/WavToMp3IntroGate";
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
              <AudioCompressorIntroGate active={tool.id === "audio-compressor"}>
              <Mp3CompressorIntroGate active={tool.id === "mp3-compressor"}>
              <AudioMergerIntroGate active={tool.id === "audio-merger"}>
              <AudioNormalizerIntroGate active={tool.id === "audio-normalizer"}>
              <FadeInOutCreatorIntroGate active={tool.id === "fade-in-out-creator"}>
              <FlacConverterIntroGate active={tool.id === "flac-converter"}>
              <M4aConverterIntroGate active={tool.id === "m4a-converter"}>
              <Mp3ConverterIntroGate active={tool.id === "mp3-converter"}>
              <Mp3MetadataEditorIntroGate active={tool.id === "mp3-metadata-editor"}>
              <AudioSpeedChangerIntroGate active={tool.id === "mp3-speed-changer"}>
              <Mp3ToMp4IntroGate active={tool.id === "mp3-to-mp4"}>
              <Mp3ToWavIntroGate active={tool.id === "mp3-to-wav"}>
              <Mp3TrimmerIntroGate active={tool.id === "mp3-trimmer"}>
              <Mp3VolumeBoosterIntroGate active={tool.id === "mp3-volume-booster"}>
              <OggConverterIntroGate active={tool.id === "ogg-converter"}>
              <SilenceRemoverIntroGate active={tool.id === "silence-remover"}>
              <VoiceRemoverIntroGate active={tool.id === "voice-remover"}>
              <WavToMp3IntroGate active={tool.id === "wav-to-mp3"}>
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
              </WavToMp3IntroGate>
              </VoiceRemoverIntroGate>
              </SilenceRemoverIntroGate>
              </OggConverterIntroGate>
              </Mp3VolumeBoosterIntroGate>
              </Mp3TrimmerIntroGate>
              </Mp3ToWavIntroGate>
              </Mp3ToMp4IntroGate>
              </AudioSpeedChangerIntroGate>
              </Mp3MetadataEditorIntroGate>
              </Mp3ConverterIntroGate>
              </M4aConverterIntroGate>
              </FlacConverterIntroGate>
              </FadeInOutCreatorIntroGate>
              </AudioNormalizerIntroGate>
              </AudioMergerIntroGate>
              </Mp3CompressorIntroGate>
              </AudioCompressorIntroGate>
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
