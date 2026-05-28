import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";

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

export function ToolGrid() {
  const toolItems = [
    ...registry.tools.map((t) => ({
      href: `/tools/${t.slug}/`,
      label: actionLabel(t.slug, t.title),
      slugHint: t.slug,
    })),
    ...STUDIO_TOOLS.map((tool) => ({
      href: tool.href,
      label: tool.ctaLabel,
      slugHint: tool.slug,
    })),
  ];

  return (
    <CompactToolCardGrid items={toolItems} />
  );
}
