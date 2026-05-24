import { RelatedTools } from "@/components/RelatedTools";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DeletePdfPagesWorkspace } from "@/components/DeletePdfPagesWorkspace";
import { ProtectPdfWorkspace } from "@/components/ProtectPdfWorkspace";
import { RedactPdfWorkspace } from "@/components/RedactPdfWorkspace";
import { UnlockPdfWorkspace } from "@/components/UnlockPdfWorkspace";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { buildComparisonBullets, buildGuideParagraphs } from "@/lib/tool-copy";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import { breadcrumbLd, faqLd, JsonLd, softwareApplicationLd } from "@/lib/schema";
import { buildToolMetadata, getToolFaqs } from "@/lib/tool-seo";
import { allToolSlugs, resolveToolRoute } from "@/lib/variants";
import Link from "next/link";
import { notFound } from "next/navigation";

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
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{h1}</h1>
          <p className="max-w-3xl text-lg text-ink-muted">{tool.intent}</p>
        </header>

        {tool.operation === "protect" ? (
          <ProtectPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "unlock" ? (
          <UnlockPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "redact" ? (
          <RedactPdfWorkspace tool={tool} slug={slug} />
        ) : tool.operation === "delete-pages" ? (
          <DeletePdfPagesWorkspace tool={tool} slug={slug} />
        ) : (
          <ToolWorkspace tool={tool} slug={slug} />
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Before you start</h2>
          <div className="mt-4 max-w-none space-y-4 text-sm leading-relaxed text-ink-muted md:text-base">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Why teams choose this model</h2>
          <ul className="mt-4 space-y-4">
            {bullets.map((b) => (
              <li key={b.title}>
                <p className="font-semibold text-ink">{b.title}</p>
                <p className="text-sm text-ink-muted md:text-base">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {articles.length ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <h2 className="text-xl font-semibold text-ink">Guides that use this tool</h2>
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

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink">Questions</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 bg-surface/40 px-4 py-3">
                <summary className="cursor-pointer font-medium text-ink">{f.q}</summary>
                <p className="mt-2 text-sm text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter tagline="tools" />
    </>
  );
}
