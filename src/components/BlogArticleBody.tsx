import Link from "next/link";
import type { BlogPost, BlogSection } from "@/lib/types";
import { ctaPrimary } from "@/lib/cta-styles";
import { registry } from "@/lib/registry";

function ArticleTable({ table }: { table: NonNullable<BlogSection["table"]> }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-white/[0.05] text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-ink-muted">
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 ${ci === 0 ? "font-medium text-ink" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderSection(section: BlogSection) {
  const Tag = section.level === 3 ? "h3" : "h2";
  return (
    <section key={section.id} id={section.id} className="scroll-mt-24">
      <Tag
        className={
          section.level === 3
            ? "text-lg font-semibold text-ink"
            : "text-xl font-semibold tracking-tight text-ink md:text-2xl"
        }
      >
        {section.heading}
      </Tag>
      {section.type === "methodology" ? (
        <div className="mt-4 rounded-xl border border-brand/25 bg-brand/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Methodology</p>
          {(section.paragraphs || []).map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-ink-muted md:text-base">
              {p}
            </p>
          ))}
        </div>
      ) : (
        (section.paragraphs || []).map((p, i) => (
          <p key={i} className="mt-4 text-sm leading-relaxed text-ink-muted md:text-base">
            {p}
          </p>
        ))
      )}
      {section.list?.length ? (
        <ul
          className={`mt-4 space-y-2 pl-5 text-sm text-ink-muted md:text-base ${
            section.type === "workflow" ? "list-decimal" : "list-disc"
          }`}
        >
          {section.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.limitations?.length ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-ink">Limitations to know</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {section.limitations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {section.table ? <ArticleTable table={section.table} /> : null}
    </section>
  );
}

function legacyParagraphs(post: BlogPost): string[] {
  const body = post.contentBlocks?.body;
  if (!body) return [];
  if (Array.isArray(body)) return body.map(String);
  return String(body)
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BlogArticleBody({ post }: { post: BlogPost }) {
  const blocks = post.contentBlocks;
  const sections = blocks?.sections;
  const primarySlug = blocks?.primaryTool;
  const primaryTool = primarySlug ? registry.tools.find((t) => t.slug === primarySlug) : null;

  return (
    <>
      {sections?.length ? (
        <div className="mt-8 space-y-10">{sections.map(renderSection)}</div>
      ) : (
        <div className="mt-8 max-w-none space-y-5 text-sm leading-relaxed text-ink-muted md:text-base">
          {legacyParagraphs(post).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {blocks?.bestFor ? (
        <aside className="mt-10 rounded-2xl border border-brand/25 bg-brand/5 p-5">
          <p className="text-sm font-semibold text-ink">Best for</p>
          <p className="mt-1 text-sm text-ink-muted">{blocks.bestFor}</p>
        </aside>
      ) : null}

      {primaryTool ? (
        <aside className="mt-8 text-center">
          <Link href={`/tools/${primaryTool.slug}/`} className={ctaPrimary}>
            Open {primaryTool.title}
          </Link>
        </aside>
      ) : null}
    </>
  );
}
