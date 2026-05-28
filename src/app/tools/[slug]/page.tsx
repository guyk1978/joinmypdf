import { RelatedTools } from "@/components/RelatedTools";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AddPageNumbersWorkspace } from "@/components/AddPageNumbersWorkspace";
import { DeletePdfPagesWorkspace } from "@/components/DeletePdfPagesWorkspace";
import { PdfToPngWorkspace } from "@/components/PdfToPngWorkspace";
import { PdfToWordWorkspace } from "@/components/PdfToWordWorkspace";
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
import { UnlockPdfWorkspace } from "@/components/UnlockPdfWorkspace";
import { MergePdfWorkspace } from "@/components/MergePdfWorkspace";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { buildComparisonBullets, buildGuideParagraphs } from "@/lib/tool-copy";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildToolMetadata, getToolFaqs } from "@/lib/tool-seo";
import { allToolSlugs, resolveToolRoute } from "@/lib/variants";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return allToolSlugs(registry).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) return {};
  return buildToolMetadata({ tool: resolved.tool, variant: resolved.variant, slug });
}

function relatedArticlesForTool(toolSlug: string) {
  return (blogRegistry.blog || [])
    .filter((p) => (p.relatedTools || []).includes(toolSlug))
    .slice(0, 4);
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = resolveToolRoute(slug, registry);
  if (!resolved) notFound();
  const { tool, variant } = resolved;
  const faqs = getToolFaqs(tool, variant);
  const description = variant
    ? `${tool.title} for “${variant.keyword}”. ${tool.description}`
    : `${tool.description}`;
  const pathname = `/tools/${slug}/`;
  const h1 = variant ? `${tool.title} — ${variant.keyword}` : tool.title;
  const paragraphs = buildGuideParagraphs(tool, variant);
  const bullets = buildComparisonBullets(tool);
  const articles = relatedArticlesForTool(tool.slug);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All tools", path: "/tools/" },
    { name: tool.title, path: `/tools/${tool.slug}/` },
  ];
  if (variant) crumbs.push({ name: variant.keyword, path: pathname });

  return (
    <>
      <JsonLd data={softwareApplicationLd({ tool, variant, pathname, description })} />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:px-6 md:py-12">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">JoinMyPDF</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{h1}</h1>
          <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-300">{tool.intent}</p>
        </header>

        {tool.operation === "sign" ? (
          <SignPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "protect" ? (
          <ProtectPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "unlock" ? (
          <UnlockPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "redact" ? (
          <RedactPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "delete-pages" ? (
          <DeletePdfPagesWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "merge" ? (
          <MergePdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "add-page-numbers" ? (
          <AddPageNumbersWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-png" ? (
          <PdfToPngWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "pdf-to-word" ? (
          <PdfToWordWorkspace tool={tool} slug={slug} />
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

        <section className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Before you start</h2>
          <div className="mt-4 max-w-none space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Why teams choose this model</h2>
          <ul className="mt-4 space-y-4">
            {bullets.map((b) => (
              <li key={b.title}>
                <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {articles.length ? (
          <section className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Guides that use this tool</h2>
            <ul className="mt-4 space-y-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link className="text-brand hover:underline" href={`/blog/${a.slug}/`}>
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <RelatedTools tool={tool} />

        <section className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Questions</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-surface/40">
                <summary className="cursor-pointer font-medium text-slate-900 dark:text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
