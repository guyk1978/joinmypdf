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
  };
  return map[slug] || title;
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
      {registry.tools.map((t) => (
        <article
          key={t.slug}
          className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm shadow-black/30"
        >
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
      ))}
      </div>
    </div>
  );
}
