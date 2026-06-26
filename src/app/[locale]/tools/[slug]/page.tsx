import { ToolGlassProvider } from "@/context/ToolGlassContext";
import { ToolPageShellProvider } from "@/context/ToolPageShellContext";
import { ToolBeforeYouStart } from "@/components/ToolBeforeYouStart";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { ToolPageInfoBlock } from "@/components/ToolPageInfoBlock";
import { RelatedTools } from "@/components/RelatedTools";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AddPageNumbersWorkspace } from "@/components/AddPageNumbersWorkspace";
import { DeletePdfPagesWorkspace } from "@/components/DeletePdfPagesWorkspace";
import { PdfToPngWorkspace } from "@/components/PdfToPngWorkspace";
import { PdfToWordWorkspace } from "@/components/PdfToWordWorkspace";
import { PdfToTextWorkspace } from "@/components/PdfToTextWorkspace";
import { ExtractImagesWorkspace } from "@/components/ExtractImagesWorkspace";
import { WordToPdfWorkspace } from "@/components/WordToPdfWorkspace";
import { ExcelToPdfWorkspace } from "@/components/ExcelToPdfWorkspace";
import { PowerpointToPdfWorkspace } from "@/components/PowerpointToPdfWorkspace";
import { PdfToPowerpointWorkspace } from "@/components/PdfToPowerpointWorkspace";
import { PdfToExcelWorkspace } from "@/components/PdfToExcelWorkspace";
import { HeicToPdfWorkspace } from "@/components/HeicToPdfWorkspace";
import { CropPdfWorkspace } from "@/components/CropPdfWorkspace";
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
import { RepairPdfWorkspace } from "@/components/RepairPdfWorkspace";
import { RemoveHiddenMetadataWorkspace } from "@/components/RemoveHiddenMetadataWorkspace";
import { PdfPasswordRecoveryWorkspace } from "@/components/PdfPasswordRecoveryWorkspace";
import { AnnotatePdfWorkspace } from "@/components/AnnotatePdfWorkspace";
import { ReorderPdfPagesWorkspace } from "@/components/ReorderPdfPagesWorkspace";
import { ExtractPdfPagesWorkspace } from "@/components/ExtractPdfPagesWorkspace";
import { BatchRenamePdfWorkspace } from "@/components/BatchRenamePdfWorkspace";
import { PdfTextEditorWorkspace } from "@/components/PdfTextEditorWorkspace";
import { ComparePdfWorkspace } from "@/components/ComparePdfWorkspace";
import { BookletPdfWorkspace } from "@/components/BookletPdfWorkspace";
import { SafeShareAuditorWorkspace } from "@/components/SafeShareAuditorWorkspace";
import { CustomPaperMarginWorkspace } from "@/components/CustomPaperMarginWorkspace";
import { UnlockPdfWorkspace } from "@/components/UnlockPdfWorkspace";
import { MergePdfWorkspace } from "@/components/MergePdfWorkspace";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { LocalProcessingInfographic } from "@/components/LocalProcessingInfographic";
import { Link } from "@/i18n/navigation";
import {
  buildLocalizedGuideParagraphs,
  getLocalizedToolFaqs,
  localizedToolTitle,
  translateToolIntent,
} from "@/lib/i18n-tool-page";
import { getBlogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildLocalizedToolMetadata, buildToolSeoCopy } from "@/lib/tool-seo";
import { resolveToolRoute } from "@/lib/variants";
import { toolPageDashboardStack, toolPageDashboardWidth, toolPageInfoWidth } from "@/lib/tool-ui";
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
    if (tool.slug) slugs.add(tool.slug);
    for (const variant of tool.longTailPages || []) {
      if (variant.slug) slugs.add(variant.slug);
    }
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
  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) return {};
  const tTools = await getTranslations({ locale, namespace: "Tools" });
  const tPage = await getTranslations({ locale, namespace: "ToolPage" });
  return buildLocalizedToolMetadata({
    tool: resolved.tool,
    variant: resolved.variant,
    slug,
    locale,
    tTools,
    tPage,
  });
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

  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");

  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) notFound();
  const { tool, variant } = resolved;

  const displayTitle = localizedToolTitle(tTools, tool, variant);
  const subtitle = translateToolIntent(tTools, tool.slug, tool.intent);
  const faqs = getLocalizedToolFaqs(tPage, tool, variant, displayTitle, locale);
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

  const crumbs = [
    { name: tPage("breadcrumbHome"), path: "/" },
    { name: tPage("breadcrumbAllTools"), path: "/tools/" },
    { name: localizedToolTitle(tTools, tool, null), path: `/tools/${tool.slug}/` },
  ];
  if (variant) crumbs.push({ name: variant.keyword, path: pathname });

  return (
    <>
      <JsonLd
        data={softwareApplicationLd({
          tool,
          variant,
          pathname,
          description,
          locale,
          name: displayTitle,
        })}
      />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <SiteHeader />
      <main className={`${toolPageDashboardWidth} py-8 md:py-10`}>
        <div className={toolPageDashboardStack}>
        <ToolGlassProvider category={tool.category}>
        <ToolPageShellProvider headline={displayTitle} subline={subtitle} slug={slug} stacked>
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
        ) : tool.operation === "flatten-pdf" ? (
          <FlattenPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "repair-pdf" ? (
          <RepairPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "remove-hidden-metadata" ? (
          <RemoveHiddenMetadataWorkspace tool={tool} slug={slug} />
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
        ) : tool.operation === "heic-to-pdf" ? (
          <HeicToPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "crop-pdf" ? (
          <CropPdfWorkspace tool={tool} slug={slug} />
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
        </ToolPageShellProvider>

        <ToolPageInfoBlock className={toolPageInfoWidth}>
        <ToolPageDashboardSection>
          <ToolBeforeYouStart title={tPage("beforeYouStart")}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </ToolBeforeYouStart>
        </ToolPageDashboardSection>

        <LocalProcessingInfographic layout="dashboard" />

        {articles.length ? (
          <ToolPageDashboardSection aria-labelledby="related-guides-heading">
            <h2
              id="related-guides-heading"
              className="mb-3 text-sm font-semibold tracking-wide text-ink dark:text-white"
            >
              {tPage("relatedGuides")}
            </h2>
            <ul className="space-y-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    className="text-xs leading-relaxed text-neutral-700 hover:underline dark:text-neutral-400 md:text-sm"
                    href={`/blog/${a.slug}/`}
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </ToolPageDashboardSection>
        ) : null}

        <RelatedTools tool={tool} />

        <ToolPageDashboardSection aria-labelledby="tool-faq-heading">
          <h2 id="tool-faq-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink dark:text-white">
            {tPage("questions")}
          </h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="tool-page-faq-item"
              >
                <summary className="cursor-pointer text-sm font-medium text-ink dark:text-white">{f.q}</summary>
                <p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-400 md:text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </ToolPageDashboardSection>
        </ToolPageInfoBlock>
        </ToolGlassProvider>
        </div>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
