import type { ToolDefinition, ToolVariant } from "./types";

const verb: Record<string, string> = {
  merge: "merge PDFs",
  compress: "compress a PDF",
  split: "split a PDF",
  "delete-pages": "delete pages from a PDF",
  "add-page-numbers": "add page numbers to a PDF",
  "crop-pdf": "crop a PDF in your browser",
  "add-watermark": "add a text watermark to a PDF",
  "rotate-pdf": "rotate PDF pages in your browser",
  "autocad-to-pdf": "convert AutoCAD DXF drawings to PDF",
  "openoffice-to-pdf": "convert OpenOffice documents to PDF",
  "markdown-to-pdf": "convert Markdown to PDF",
  "html-to-pdf": "convert HTML to PDF",
  "ebook-to-pdf": "convert EPUB eBooks to PDF",
  "iwork-to-pdf": "convert Apple iWork files to PDF",
  protect: "password-protect a PDF",
  unlock: "remove a PDF password",
  redact: "redact sensitive PDF content",
  sign: "sign a PDF with your signature",
  "jpg-to-pdf": "turn images into a PDF",
  "png-to-pdf": "convert PNG images into a PDF",
  "heic-to-pdf": "convert HEIC photos into a PDF",
  "pdf-to-jpg": "export PDF pages as JPG images",
  "pdf-to-png": "export PDF pages as PNG images",
  "pdf-to-text": "extract text from a PDF",
  "extract-images": "extract embedded images from a PDF",
};

export function toolActionPhrase(operation: string): string {
  return verb[operation] || "work with your PDF";
}

export function buildGuideParagraphs(
  tool: ToolDefinition,
  variant: ToolVariant | null
): string[] {
  const kw = variant?.keyword || tool.primaryKeyword;
  const action = toolActionPhrase(tool.operation);
  const secondary = (tool.secondaryKeywords || []).slice(0, 4).join(", ");
  const useCases = (tool.useCases || []).slice(0, 2);

  const p1 = variant
    ? `This page helps you ${action} when your search intent is “${kw}”. You get the same JoinMyPDF experience as our main ${tool.title} flow—clear steps, local processing in your browser, and a straightforward download when you are done.`
    : `${tool.description} Whether you are packaging invoices, preparing coursework, or sending a contract pack, the goal is simple: ${action} without installing desktop software.`;

  const p2 =
    "Privacy is a product decision here: your files are handled in the browser session on your device rather than uploaded to JoinMyPDF servers for processing. That model reduces transfer time for many jobs and is easier to reason about when documents are sensitive.";

  const p3 = variant?.angle
    ? `Because you landed on a page tuned for “${kw}”, we emphasize ${variant.angle.toLowerCase()} If you ever want the generic experience, you can always switch to the main ${tool.title} page from the navigation.`
    : `If you need related steps next, many people follow merge with compression for email limits, or split first when only a few pages matter. Internal links on this page point to adjacent tools so you can continue in one sitting.`;

  const p4 =
    secondary.length > 0
      ? `Helpful related phrases people use alongside this task include ${secondary}. You do not need to worry about matching exact wording—follow the on-page checklist, confirm the preview looks right, and download.`
      : "Follow the on-page checklist, confirm previews where available, and download once the status line shows success.";

  const p5 =
    useCases.length > 0
      ? `Typical situations include ${useCases.join(" and ")}.`
      : "If you are new to browser-based PDF tools, start with a small test file, verify the output, then run your real documents.";

  const p6 =
    "If something fails, it is usually a browser memory limit on very large files, a mixed set of inputs, or a protected PDF. Try fewer pages per run, export from the original authoring app again, or split the document before converting.";

  return [p1, p2, p3, p4, p5, p6];
}

export function buildComparisonBullets(tool: ToolDefinition): { title: string; text: string }[] {
  return [
    {
      title: "Local processing",
      text: "JoinMyPDF runs merge, split, compress, and common conversions in your browser session instead of routing files through our infrastructure.",
    },
    {
      title: "No watermark added",
      text: "Standard downloads are yours to share—JoinMyPDF does not stamp marketing watermarks on outputs for these tools.",
    },
    {
      title: "Fast for everyday sizes",
      text: "Skipping upload queues often makes small and mid-size documents feel snappier than traditional cloud converters.",
    },
    {
      title: "Straightforward UI",
      text: "Each tool follows the same dropzone, status, and download pattern so you spend less time relearning controls.",
    },
  ];
}
