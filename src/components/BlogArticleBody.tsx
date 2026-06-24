import { Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { AdContainer } from "@/components/AdContainer";
import type { BlogPost, BlogSection } from "@/lib/types";
import { homePrimaryPillBtn } from "@/lib/tool-ui";
import { registry } from "@/lib/registry";

function ArticleTable({ table }: { table: NonNullable<BlogSection["table"]> }) {
  return (
    <div className="article-table overflow-x-auto border border-neutral-800 bg-black dark:border-neutral-800 dark:bg-black">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-white dark:text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 text-neutral-400">
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 ${ci === 0 ? "font-medium text-neutral-200" : ""}`}>
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

  let paragraphCount = 0;
  let midAdInserted = false;

  const renderParagraph = (p: string, key: string) => {
    paragraphCount += 1;
    const insertAdAfter = paragraphCount === 2 && !midAdInserted;
    if (insertAdAfter) midAdInserted = true;

    return (
      <Fragment key={key}>
        <p className="article-prose">{p}</p>
        {insertAdAfter ? <AdContainer variant="article" /> : null}
      </Fragment>
    );
  };

  const renderSectionContent = (section: BlogSection) => {
    const Tag = section.level === 3 ? "h3" : "h2";

    return (
      <section key={section.id} id={section.id} className="article-section scroll-mt-28">
        <Tag
          className={
            section.level === 3
              ? "article-heading article-heading--h3"
              : "article-heading article-heading--h2"
          }
        >
          {section.heading}
        </Tag>
        {section.type === "methodology" ? (
          <aside className="article-callout article-callout--methodology">
            <p className="article-callout__eyebrow">Methodology</p>
            {(section.paragraphs || []).map((p, i) => renderParagraph(p, `${section.id}-methodology-${i}`))}
          </aside>
        ) : (
          (section.paragraphs || []).map((p, i) => renderParagraph(p, `${section.id}-p-${i}`))
        )}
        {section.list?.length ? (
          <ul
            className={`article-list space-y-2 pl-5 ${section.type === "workflow" ? "list-decimal" : "list-disc"}`}
          >
            {section.list.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : null}
        {section.limitations?.length ? (
          <aside className="article-callout">
            <p className="article-callout__title">Limitations to know</p>
            <ul className="article-list list-disc space-y-2 pl-5">
              {section.limitations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </aside>
        ) : null}
        {section.table ? <ArticleTable table={section.table} /> : null}
      </section>
    );
  };

  return (
    <>
      {sections?.length ? (
        <div className="article-body">{sections.map(renderSectionContent)}</div>
      ) : (
        <div className="article-body">
          {legacyParagraphs(post).map((p, i) => renderParagraph(p, `legacy-${i}`))}
        </div>
      )}

      {blocks?.bestFor ? (
        <aside className="article-callout">
          <p className="article-callout__title">Best for</p>
          <p className="article-prose">{blocks.bestFor}</p>
        </aside>
      ) : null}

      {primaryTool ? (
        <aside className="article-cta flex justify-center">
          <Link href={`/tools/${primaryTool.slug}/`} className={`${homePrimaryPillBtn} gap-2`} prefetch={false}>
            Open {primaryTool.title}
            <ArrowUpRight className="ms-2 h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </Link>
        </aside>
      ) : null}
    </>
  );
}
