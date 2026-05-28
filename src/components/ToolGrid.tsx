import Link from "next/link";
import { StudioToolCards } from "@/components/StudioToolCards";
import { registry } from "@/lib/registry";
import { ctaPrimary, ctaSecondary } from "@/lib/cta-styles";

function actionLabel(slug: string, title: string): string {
  const map: Record<string, string> = {
    "pdf-merge": "Merge PDF",
    "pdf-compress": "Compress PDF",
    "pdf-split": "Split PDF",
    "add-page-numbers": "Add Page Numbers",
    "sign-pdf": "Sign PDF",
    "jpg-to-pdf": "JPG to PDF",
    "pdf-to-jpg": "PDF to JPG",
    "pdf-to-png": "PDF to PNG",
    "png-to-pdf": "PNG to PDF",
    "heic-to-pdf": "HEIC to PDF",
    "crop-pdf": "Crop PDF",
    "add-watermark": "Add Watermark",
    "rotate-pdf": "Rotate PDF",
    "autocad-to-pdf": "AutoCAD to PDF",
    "openoffice-to-pdf": "OpenOffice to PDF",
    "markdown-to-pdf": "Markdown to PDF",
    "html-to-pdf": "HTML to PDF",
    "ebook-to-pdf": "eBook to PDF",
    "iwork-to-pdf": "iWork to PDF",
  };
  return map[slug] || title;
}

function categoryVisuals(slug: string, title: string) {
  const label = `${slug} ${title}`.toLowerCase();
  if (/(word|excel|powerpoint|openoffice|iwork|ebook)/.test(label)) {
    return {
      wrap: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200",
      glyph: "DOC",
    };
  }
  if (/(compress|split|merge|optimiz)/.test(label)) {
    return {
      wrap: "bg-amber-100 text-amber-800 dark:bg-red-500/15 dark:text-red-200",
      glyph: "OPT",
    };
  }
  if (/(html|markdown|cad|autocad|dev|code)/.test(label)) {
    return {
      wrap: "bg-emerald-100 text-emerald-800 dark:bg-purple-500/15 dark:text-purple-200",
      glyph: "</>",
    };
  }
  return {
    wrap: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
    glyph: "PDF",
  };
}

export function ToolGrid() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">Studio tools</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Live-preview builders with client-side PDF export—no uploads required.
          </p>
        </div>
        <StudioToolCards />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {registry.tools.map((t) => {
        const visuals = categoryVisuals(t.slug, t.title);
        return (
        <article
          key={t.slug}
          className="flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-bold tracking-wide ${visuals.wrap}`}
              aria-hidden="true"
            >
              {visuals.glyph}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-ink">{t.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t.intent}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link className={ctaPrimary + " flex-1 text-center sm:flex-none"} href={`/tools/${t.slug}/`}>
              {actionLabel(t.slug, t.title)}
            </Link>
            <Link
              className={ctaSecondary + " flex-1 text-center sm:flex-none"}
              href={`/tools/${t.slug}/#tool-workspace`}
            >
              Upload files
            </Link>
          </div>
        </article>
      );
      })}
      </div>
    </div>
  );
}
