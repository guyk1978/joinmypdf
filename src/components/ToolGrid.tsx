import Link from "next/link";
import { StudioToolCards } from "@/components/StudioToolCards";
import { registry } from "@/lib/registry";

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
      wrap: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      glyph: "DOC",
    };
  }
  if (/(compress|split|merge|optimiz)/.test(label)) {
    return {
      wrap: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      glyph: "OPT",
    };
  }
  if (/(html|markdown|cad|autocad|dev|code)/.test(label)) {
    return {
      wrap: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
      glyph: "</>",
    };
  }
  return {
    wrap: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    glyph: "PDF",
  };
}

export function ToolGrid() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Studio tools</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Live-preview builders with client-side PDF export—no uploads required.
          </p>
        </div>
        <StudioToolCards />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {registry.tools.map((t) => {
        const visuals = categoryVisuals(t.slug, t.title);
        const label = actionLabel(t.slug, t.title);
        return (
        <Link
          key={t.slug}
          href={`/tools/${t.slug}/`}
          className="group flex min-h-[108px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold tracking-wide ${visuals.wrap}`}
            aria-hidden="true"
          >
            {visuals.glyph}
          </span>
          <span className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
        </Link>
      );
      })}
      </div>
    </div>
  );
}
