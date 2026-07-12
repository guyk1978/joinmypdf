import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { ToolBreadcrumbs } from "@/components/layout/ToolBreadcrumbs";
import { ToolMarketingSections } from "@/components/layout/ToolMarketingSections";
import { AppPageShell } from "@/components/AppPageShell";
import { AddPageNumbersWorkspace } from "@/components/AddPageNumbersWorkspace";
import { DeletePdfPagesWorkspace } from "@/components/DeletePdfPagesWorkspace";
import { PdfToPngWorkspace } from "@/components/PdfToPngWorkspace";
import { PdfToWordWorkspace } from "@/components/PdfToWordWorkspace";
import { PdfToTextWorkspace } from "@/components/PdfToTextWorkspace";
import { PdfToHtmlWorkspace } from "@/components/PdfToHtmlWorkspace";
import { PdfToEpubWorkspace } from "@/components/PdfToEpubWorkspace";
import { PdfToXpsWorkspace } from "@/components/PdfToXpsWorkspace";
import { ExtractTablesPdfWorkspace } from "@/components/ExtractTablesPdfWorkspace";
import { ExtractImagesWorkspace } from "@/components/ExtractImagesWorkspace";
import { WordToPdfWorkspace } from "@/components/WordToPdfWorkspace";
import { ExcelToPdfWorkspace } from "@/components/ExcelToPdfWorkspace";
import { PowerpointToPdfWorkspace } from "@/components/PowerpointToPdfWorkspace";
import { PdfToPowerpointWorkspace } from "@/components/PdfToPowerpointWorkspace";
import { PdfToExcelWorkspace } from "@/components/PdfToExcelWorkspace";
import { HeicToPdfWorkspace } from "@/components/HeicToPdfWorkspace";
import { HeicToJpgWorkspace } from "@/components/HeicToJpgWorkspace";
import { WebpToJpgWorkspace } from "@/components/WebpToJpgWorkspace";
import { SvgToPngWorkspace } from "@/components/SvgToPngWorkspace";
import { ImageGrayscaleWorkspace } from "@/components/ImageGrayscaleWorkspace";
import { FlipImageWorkspace } from "@/components/FlipImageWorkspace";
import { ImageMetadataEditorWorkspace } from "@/components/ImageMetadataEditorWorkspace";
import { ImageOptimizerWorkspace } from "@/components/ImageOptimizerWorkspace";
import { PaintOnImageWorkspace } from "@/components/PaintOnImageWorkspace";
import { CropPdfWorkspace } from "@/components/CropPdfWorkspace";
import { VideoToMp4Workspace } from "@/components/VideoToMp4Workspace";
import { VideoCompressorWorkspace } from "@/components/VideoCompressorWorkspace";
import { VideoResizerWorkspace } from "@/components/tools/VideoResizerWorkspace";
import { VideoRotatorWorkspace } from "@/components/tools/VideoRotatorWorkspace";
import { VideoSpeedControllerWorkspace } from "@/components/tools/VideoSpeedControllerWorkspace";
import { VideoSpeedWorkspace } from "@/components/tools/VideoSpeedWorkspace";
import { VideoToGifWorkspace } from "@/components/tools/VideoToGifWorkspace";
import { VideoToMp3Workspace } from "@/components/tools/VideoToMp3Workspace";
import { VideoMuterWorkspace } from "@/components/tools/VideoMuterWorkspace";
import { VideoMetadataCleanerWorkspace } from "@/components/tools/VideoMetadataCleanerWorkspace";
import { VideoConverterWorkspace } from "@/components/tools/VideoConverterWorkspace";
import { VideoTrimmerWorkspace } from "@/components/tools/VideoTrimmerWorkspace";
import { CropImageWorkspace } from "@/components/CropImageWorkspace";
import { ConvertToPngWorkspace } from "@/components/ConvertToPngWorkspace";
import { ImageConverterWorkspace } from "@/components/ImageConverterWorkspace";
import { SvgOptimizerWorkspace } from "@/components/SvgOptimizerWorkspace";
import { RotateImageWorkspace } from "@/components/RotateImageWorkspace";
import { CompressImageWorkspace } from "@/components/CompressImageWorkspace";
import { ResizeImageWorkspace } from "@/components/ResizeImageWorkspace";
import { AddWatermarkWorkspace } from "@/components/AddWatermarkWorkspace";
import { RotatePdfWorkspace } from "@/components/RotatePdfWorkspace";
import { AutocadToPdfWorkspace } from "@/components/AutocadToPdfWorkspace";
import { OpenofficeToPdfWorkspace } from "@/components/OpenofficeToPdfWorkspace";
import { MarkdownToPdfWorkspace } from "@/components/MarkdownToPdfWorkspace";
import { HtmlToPdfWorkspace } from "@/components/HtmlToPdfWorkspace";
import { EbookToPdfWorkspace } from "@/components/EbookToPdfWorkspace";
import { IworkToPdfWorkspace } from "@/components/IworkToPdfWorkspace";
import { ProtectPdfWorkspace } from "@/components/ProtectPdfWorkspace";
import { SignPdfWorkspace } from "@/components/SignPdfWorkspace";
import { RedactPdfWorkspace } from "@/components/RedactPdfWorkspace";
import { FlattenPdfWorkspace } from "@/components/FlattenPdfWorkspace";
import { PdfAConverterWorkspace } from "@/components/PdfAConverterWorkspace";
import { RepairPdfWorkspace } from "@/components/RepairPdfWorkspace";
import { RemoveHiddenMetadataWorkspace } from "@/components/RemoveHiddenMetadataWorkspace";
import { PdfMetadataEditorWorkspace } from "@/components/PdfMetadataEditorWorkspace";
import { PdfLinearizationWorkspace } from "@/components/PdfLinearizationWorkspace";
import { NUpPdfWorkspace } from "@/components/NUpPdfWorkspace";
import { GrayscalePdfWorkspace } from "@/components/GrayscalePdfWorkspace";
import { PdfPasswordRecoveryWorkspace } from "@/components/PdfPasswordRecoveryWorkspace";
import { AnnotatePdfWorkspace } from "@/components/AnnotatePdfWorkspace";
import { ReorderPdfPagesWorkspace } from "@/components/ReorderPdfPagesWorkspace";
import { ExtractPdfPagesWorkspace } from "@/components/ExtractPdfPagesWorkspace";
import { BatchRenamePdfWorkspace } from "@/components/BatchRenamePdfWorkspace";
import { PdfTextEditorWorkspace } from "@/components/PdfTextEditorWorkspace";
import { ComparePdfWorkspace } from "@/components/ComparePdfWorkspace";
import { BookletPdfWorkspace } from "@/components/BookletPdfWorkspace";
import { SafeShareAuditorWorkspace } from "@/components/SafeShareAuditorWorkspace";
import { PdfSignatureValidatorWorkspace } from "@/components/PdfSignatureValidatorWorkspace";
import { CustomPaperMarginWorkspace } from "@/components/CustomPaperMarginWorkspace";
import { UnlockPdfWorkspace } from "@/components/UnlockPdfWorkspace";
import { AppleTouchIconWorkspace } from "@/components/AppleTouchIconWorkspace";
import { FaviconCompressorWorkspace } from "@/components/FaviconCompressorWorkspace";
import { FaviconCodeGeneratorWorkspace } from "@/components/FaviconCodeGeneratorWorkspace";
import { FaviconPreviewerWorkspace } from "@/components/FaviconPreviewerWorkspace";
import { JsonFormatterWorkspace } from "@/components/JsonFormatterWorkspace";
import { JsonToCsvWorkspace } from "@/components/JsonToCsvWorkspace";
import { JsonMinifierWorkspace } from "@/components/JsonMinifierWorkspace";
import { CsvToJsonWorkspace } from "@/components/CsvToJsonWorkspace";
import { Base64EncoderDecoderWorkspace } from "@/components/Base64EncoderDecoderWorkspace";
import { UrlEncoderDecoderWorkspace } from "@/components/UrlEncoderDecoderWorkspace";
import { TextDiffCheckerWorkspace } from "@/components/TextDiffCheckerWorkspace";
import { StringGeneratorWorkspace } from "@/components/StringGeneratorWorkspace";
import { LoremIpsumGeneratorWorkspace } from "@/components/LoremIpsumGeneratorWorkspace";
import { HtmlMarkdownConverterWorkspace } from "@/components/HtmlMarkdownConverterWorkspace";
import { WordCharacterCounterWorkspace } from "@/components/WordCharacterCounterWorkspace";
import { UserAgentParserWorkspace } from "@/components/tools/developer/UserAgentParserWorkspace";
import { QRCodeGeneratorWorkspace } from "@/components/tools/developer/QRCodeGeneratorWorkspace";
import { JWTDebuggerWorkspace } from "@/components/tools/developer/JWTDebuggerWorkspace";
import { YamlJsonConverterWorkspace } from "@/components/tools/data-conversion/YamlJsonConverterWorkspace";
import { CsvMarkdownConverterWorkspace } from "@/components/tools/data-conversion/CsvMarkdownConverterWorkspace";
import { SqlQueryFormatterWorkspace } from "@/components/tools/data-conversion/SqlQueryFormatterWorkspace";
import { PasswordGeneratorWorkspace } from "@/components/tools/security/PasswordGeneratorWorkspace";
import { HashGeneratorWorkspace } from "@/components/tools/security/HashGeneratorWorkspace";
import { UuidGeneratorWorkspace } from "@/components/tools/security/UuidGeneratorWorkspace";
import { SslDecoderWorkspace } from "@/components/tools/security/SslDecoderWorkspace";
import { ColorConverterWorkspace } from "@/components/tools/design/ColorConverterWorkspace";
import { UnitConverterWorkspace } from "@/components/tools/productivity/UnitConverterWorkspace";
import { TimezoneConverterWorkspace } from "@/components/tools/productivity/TimezoneConverterWorkspace";
import { ReadingTimeCalculatorWorkspace } from "@/components/tools/productivity/ReadingTimeCalculatorWorkspace";
import { FaviconCropperWorkspace } from "@/components/FaviconCropperWorkspace";
import { TransparentFaviconWorkspace } from "@/components/TransparentFaviconWorkspace";
import { FaviconPackWorkspace } from "@/components/FaviconPackWorkspace";
import { SvgToFaviconWorkspace } from "@/components/SvgToFaviconWorkspace";
import { IcoToPngWorkspace } from "@/components/IcoToPngWorkspace";
import { PngToIcoWorkspace } from "@/components/PngToIcoWorkspace";
import { GenerateFaviconWorkspace } from "@/components/GenerateFaviconWorkspace";
import { MergePdfWorkspace } from "@/components/MergePdfWorkspace";
import { AudioToolPage, buildAudioToolMetadata } from "@/components/tools/AudioToolPage";
import { AUDIO_TOOL_IDS, getAudioToolById } from "@/lib/audio-tools";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { resolveToolSeoPageOverride } from "@/lib/tool-seo-overrides";
import {
  buildLocalizedGuideParagraphs,
  getLocalizedToolFaqs,
  localizedToolTitle,
  translateToolIntent,
} from "@/lib/i18n-tool-page";
import { getBlogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { SeoToolLandingPage } from "@/components/SeoToolLandingPage";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import {
  generateSeoToolLandingMetadata,
  isSeoToolLandingSlug,
  SEO_TOOL_LANDING_SLUGS,
  type SeoToolLandingSlug,
} from "@/lib/seo-tool-landings";
import { buildLocalizedToolMetadata, buildToolSeoCopy } from "@/lib/tool-seo";
import { buildToolBreadcrumbTrail } from "@/lib/tool-breadcrumb-hub";
import { resolveToolRoute } from "@/lib/variants";
import { STUDIO_TOOL_SLUGS } from "@/lib/studio-tools";
import { toolPageDashboardStack, toolPageDashboardWidth, productPageMainClassName } from "@/lib/tool-ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = new Set<string>();
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  if (!cwd) return [];
  const toolsRoot = path.join(cwd, "tools");

  try {
    const entries = await readdir(toolsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      if (!slug || slug === "index") continue;
      if (resolveToolRoute(slug, registry)) slugs.add(slug);
    }
  } catch {
    // Fall back to JSON-derived slugs below.
  }

  // Fallback/source-of-truth completion from registry JSON.
  for (const tool of registry.tools || []) {
    if (tool.slug) {
      if (STUDIO_TOOL_SLUGS.includes(tool.slug)) continue;
      slugs.add(tool.slug);
    }
    for (const variant of tool.longTailPages || []) {
      if (variant.slug) slugs.add(variant.slug);
    }
  }

  for (const audioId of AUDIO_TOOL_IDS) {
    slugs.add(audioId);
  }

  // Privacy-first SEO landings live as App Router pages, but Cloudflare/next-on-pages
  // resolves /[locale]/tools/:slug through this dynamic segment. With dynamicParams=false
  // they 404 unless included here — and rendered via SeoToolLandingPage below.
  for (const landingSlug of SEO_TOOL_LANDING_SLUGS) {
    slugs.add(landingSlug);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!slug) return {};
  if (isSeoToolLandingSlug(slug)) {
    return generateSeoToolLandingMetadata(slug, locale);
  }
  const audioTool = getAudioToolById(slug);
  if (audioTool) {
    const tPage = await getTranslations({ locale, namespace: "ToolPage" });
    return buildAudioToolMetadata(audioTool, locale, tPage);
  }
  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) return {};
  const tTools = await getTranslations({ locale, namespace: "Tools" });
  const tPage = await getTranslations({ locale, namespace: "ToolPage" });
  const metadata = buildLocalizedToolMetadata({
    tool: resolved.tool,
    variant: resolved.variant,
    slug,
    locale,
    tTools,
    tPage,
  });
  if (resolved.variant) {
    return {
      ...metadata,
      robots: { index: false, follow: true },
    };
  }
  return metadata;
}

function relatedArticlesForTool(toolSlug: string, locale: string) {
  return (getBlogRegistry(locale).blog || [])
    .filter((p) => (p.relatedTools || []).includes(toolSlug))
    .slice(0, 4);
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!slug) notFound();
  setRequestLocale(locale);

  if (isSeoToolLandingSlug(slug)) {
    return (
      <SeoToolLandingPage
        slug={slug as SeoToolLandingSlug}
        params={Promise.resolve({ locale })}
      />
    );
  }

  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");

  const audioTool = getAudioToolById(slug);
  if (audioTool) {
    return <AudioToolPage tool={audioTool} slug={slug} locale={locale} />;
  }

  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) notFound();
  const { tool, variant } = resolved;

  const displayTitle = localizedToolTitle(tTools, tool, variant);
  const subtitle = translateToolIntent(tTools, tool.slug, tool.intent);
  const seoOverride = resolveToolSeoPageOverride(tool, variant, tPage);
  const pageHeadline = seoOverride?.h1 ?? displayTitle;
  const faqs = getLocalizedToolFaqs(tPage, tool, variant, pageHeadline, locale);
  const { description } = buildToolSeoCopy({
    tool,
    variant,
    locale,
    tTools,
    tPage,
  });
  const pathname = `/tools/${slug}/`;
  const paragraphs = buildLocalizedGuideParagraphs(tPage, tool, variant);
  const articles = relatedArticlesForTool(tool.slug, locale);
  const schemaDescription = seoOverride?.schemaDescription ?? description;
  const schemaName = seoOverride?.h1 ?? displayTitle;
  const useEnhancedSchema = Boolean(seoOverride);

  const crumbs = buildToolBreadcrumbTrail({
    tool,
    variant,
    pathname,
    tPage,
    tTools,
  });
  const breadcrumbItems = crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }));

  return (
    <>
      <JsonLd
        data={softwareApplicationLd({
          tool,
          variant,
          pathname,
          description: schemaDescription,
          locale,
          name: schemaName,
          operatingSystem: useEnhancedSchema ? "Web Browser" : undefined,
          applicationCategory: useEnhancedSchema ? "UtilitiesApplication" : undefined,
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <AppPageShell mainClassName={productPageMainClassName}>
        <div className={toolPageDashboardStack}>
        <ToolGlassProvider category={tool.category}>
        <ToolPageShellProvider headline={pageHeadline} subline={subtitle} tagline={seoOverride?.heroTagline} slug={slug} stacked>
        <ToolLayout
          faqs={faqs}
          breadcrumbs={
            <ToolBreadcrumbs tool={tool} category={tool.category} items={breadcrumbItems} />
          }
          marketing={
            <ToolMarketingSections
              tool={tool}
              paragraphs={paragraphs}
              articles={articles}
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
        {tool.operation === "sign" ? (
          <SignPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "protect" ? (
          <ProtectPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "unlock" ? (
          <UnlockPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-password-recovery" ? (
          <PdfPasswordRecoveryWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "redact" ? (
          <RedactPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "safe-to-share-auditor" ? (
          <SafeShareAuditorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-signature-validator" ? (
          <PdfSignatureValidatorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "flatten-pdf" ? (
          <FlattenPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "repair-pdf" ? (
          <RepairPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-a-converter" ? (
          <PdfAConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "remove-hidden-metadata" ? (
          <RemoveHiddenMetadataWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-metadata-editor" ? (
          <PdfMetadataEditorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-linearization" ? (
          <PdfLinearizationWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "n-up-pdf" ? (
          <NUpPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "grayscale-pdf" ? (
          <GrayscalePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "delete-pages" ? (
          <DeletePdfPagesWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "merge" ? (
          <MergePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "batch-rename-pdf" ? (
          <BatchRenamePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-text-editor" ? (
          <PdfTextEditorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "annotate-pdf" ? (
          <AnnotatePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "reorder-pdf-pages" ? (
          <ReorderPdfPagesWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "extract-pdf-pages" ? (
          <ExtractPdfPagesWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "compare-pdf" ? (
          <ComparePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-booklet" ? (
          <BookletPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "add-page-numbers" ? (
          <AddPageNumbersWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-png" ? (
          <PdfToPngWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-word" ? (
          <PdfToWordWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-text" ? (
          <PdfToTextWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-html" ? (
          <PdfToHtmlWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-epub" ? (
          <PdfToEpubWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-xps" ? (
          <PdfToXpsWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "extract-images" ? (
          <ExtractImagesWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "word-to-pdf" ? (
          <WordToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "excel-to-pdf" ? (
          <ExcelToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "powerpoint-to-pdf" ? (
          <PowerpointToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-powerpoint" ? (
          <PdfToPowerpointWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-excel" ? (
          <PdfToExcelWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "extract-tables-pdf" ? (
          <ExtractTablesPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "heic-to-pdf" ? (
          <HeicToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "heic-to-jpg" ? (
          <HeicToJpgWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "webp-to-jpg" ? (
          <WebpToJpgWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "svg-to-png" ? (
          <SvgToPngWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "image-grayscale" ? (
          <ImageGrayscaleWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "flip-image" ? (
          <FlipImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "image-metadata-editor" ? (
          <ImageMetadataEditorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "image-optimizer" ? (
          <ImageOptimizerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "paint-on-image" ? (
          <PaintOnImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "crop-pdf" ? (
          <CropPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "crop-image" ? (
          <CropImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-to-mp4" ? (
          <VideoToMp4Workspace tool={tool} slug={slug} />
        ) : tool.operation === "video-compressor" ? (
          <VideoCompressorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-resizer" ? (
          <VideoResizerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-rotator" ? (
          <VideoRotatorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-speed-controller" ? (
          <VideoSpeedControllerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-speed" ? (
          <VideoSpeedWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-to-gif" ? (
          <VideoToGifWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-trimmer" ? (
          <VideoTrimmerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-to-mp3" ? (
          <VideoToMp3Workspace tool={tool} slug={slug} />
        ) : tool.operation === "video-muter" ? (
          <VideoMuterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-metadata-cleaner" ? (
          <VideoMetadataCleanerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "video-converter" ? (
          <VideoConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "resize-image" ? (
          <ResizeImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "convert-to-png" ? (
          <ConvertToPngWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "image-converter" ? (
          <ImageConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "svg-optimizer" ? (
          <SvgOptimizerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "rotate-image" ? (
          <RotateImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "compress-image" ? (
          <CompressImageWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "generate-favicon" ? (
          <GenerateFaviconWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "png-to-ico" ? (
          <PngToIcoWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "ico-to-png" ? (
          <IcoToPngWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "svg-to-favicon" ? (
          <SvgToFaviconWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "favicon-pack" ? (
          <FaviconPackWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "apple-touch-icon" ? (
          <AppleTouchIconWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "favicon-compressor" ? (
          <FaviconCompressorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "favicon-cropper" ? (
          <FaviconCropperWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "transparent-favicon" ? (
          <TransparentFaviconWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "favicon-code-generator" ? (
          <FaviconCodeGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "favicon-previewer" ? (
          <FaviconPreviewerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "json-formatter" ? (
          <JsonFormatterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "json-to-csv" ? (
          <JsonToCsvWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "json-minifier" ? (
          <JsonMinifierWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "csv-to-json" ? (
          <CsvToJsonWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "base64-encoder-decoder" ? (
          <Base64EncoderDecoderWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "url-encoder-decoder" ? (
          <UrlEncoderDecoderWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "text-diff-checker" || tool.operation === "text-diff" ? (
          <TextDiffCheckerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "string-generator" ? (
          <StringGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "lorem-ipsum-generator" ? (
          <LoremIpsumGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "html-markdown-converter" ? (
          <HtmlMarkdownConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "word-character-counter" ? (
          <WordCharacterCounterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "user-agent-parser" ? (
          <UserAgentParserWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "qr-code-generator" ? (
          <QRCodeGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "jwt-debugger" ? (
          <JWTDebuggerWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "yaml-json-converter" ? (
          <YamlJsonConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "csv-to-markdown-table" ? (
          <CsvMarkdownConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "sql-query-formatter" ? (
          <SqlQueryFormatterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "password-generator" ? (
          <PasswordGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "hash-generator" ? (
          <HashGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "uuid-generator" ? (
          <UuidGeneratorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "ssl-decoder" ? (
          <SslDecoderWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "color-converter" ? (
          <ColorConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "unit-converter" ? (
          <UnitConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "timezone-converter" ? (
          <TimezoneConverterWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "reading-time-calculator" ? (
          <ReadingTimeCalculatorWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "custom-paper-margin" ? (
          <CustomPaperMarginWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "add-watermark" ? (
          <AddWatermarkWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "rotate-pdf" ? (
          <RotatePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "autocad-to-pdf" ? (
          <AutocadToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "openoffice-to-pdf" ? (
          <OpenofficeToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "markdown-to-pdf" ? (
          <MarkdownToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "html-to-pdf" ? (
          <HtmlToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "ebook-to-pdf" ? (
          <EbookToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "iwork-to-pdf" ? (
          <IworkToPdfWorkspace tool={tool} slug={slug} />
        ) : (
          <ToolWorkspace tool={tool} slug={slug} />
        )}
        </ToolLayout>
        </ToolPageShellProvider>
        </ToolGlassProvider>
        </div>
      </AppPageShell>
    </>
  );
}
