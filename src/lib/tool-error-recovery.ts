import type { PdfErrorKind } from "./pdf-errors";

export type RecoveryAction = {
  href: string;
  label: string;
  hint?: string;
  variant: "primary" | "secondary";
};

export type ToolErrorRecoveryContent = {
  headline: string;
  detail: string;
  actions: RecoveryAction[];
};

const TOOLS = {
  split: { href: "/tools/pdf-split/", label: "Try Split PDF" },
  merge: { href: "/tools/pdf-merge/", label: "Try Merge PDF" },
  compress: { href: "/tools/pdf-compress/", label: "Try Compress PDF" },
  pdfToJpg: { href: "/tools/pdf-to-jpg/", label: "Export pages as JPG" },
  pdfToPng: { href: "/tools/pdf-to-png/", label: "Export pages as PNG" },
  jpgToPdf: { href: "/tools/jpg-to-pdf/", label: "Try JPG to PDF" },
  protect: { href: "/tools/protect-pdf/", label: "Protect PDF" },
  guides: { href: "/pdf-guides/", label: "Browse PDF workflow guides" },
} as const;

function withoutCurrent(actions: RecoveryAction[], slug: string): RecoveryAction[] {
  const prefix = `/tools/${slug}/`;
  return actions.filter((a) => !a.href.startsWith(prefix));
}

export function getToolErrorRecovery(
  operation: string,
  kind: PdfErrorKind,
  slug: string
): ToolErrorRecoveryContent {
  const headline = "This file might be encrypted or corrupted.";

  const encryptedDetail =
    "Unlock or re-export the file in your PDF app (Acrobat, Preview, etc.), then return here—or try a different JoinMyPDF tool below.";
  const corruptDetail =
    "Re-save or re-export from the original app, then try again. If only part of the file opens elsewhere, split or convert pages below.";
  const genericDetail =
    "Try a lighter step below, or re-export the file from the program that created it.";

  const encryptedActions: RecoveryAction[] = [
    {
      href: "/pdf-guides/",
      label: "Need to unlock it? See our PDF prep guide",
      hint: "Remove encryption in Acrobat, Preview, or your approved editor first",
      variant: "primary",
    },
    {
      ...TOOLS.split,
      label: "Try splitting the file first",
      hint: "Useful after unlock or for partial exports",
      variant: "secondary",
    },
    {
      ...TOOLS.pdfToJpg,
      hint: "Extract visible pages as images",
      variant: "secondary",
    },
  ];

  const corruptActions: RecoveryAction[] = [
    {
      ...TOOLS.split,
      hint: "Pull out readable pages only",
      variant: "primary",
    },
    {
      ...TOOLS.pdfToJpg,
      hint: "Bypass damaged PDF structure",
      variant: "secondary",
    },
  ];

  const byOperation: Record<string, RecoveryAction[]> = {
    merge: [
      { ...TOOLS.split, hint: "Process one section at a time", variant: "primary" },
      { ...TOOLS.compress, variant: "secondary" },
    ],
    compress: [
      { ...TOOLS.split, hint: "Shrink smaller parts first", variant: "primary" },
      { ...TOOLS.merge, variant: "secondary" },
    ],
    split: [
      { ...TOOLS.pdfToJpg, hint: "Get images from stubborn pages", variant: "primary" },
      { ...TOOLS.merge, variant: "secondary" },
    ],
    "jpg-to-pdf": [
      { ...TOOLS.merge, variant: "primary" },
      { ...TOOLS.compress, variant: "secondary" },
    ],
    "heic-to-pdf": [
      { ...TOOLS.jpgToPdf, hint: "Try JPG to PDF for non-HEIC photos", variant: "primary" },
      { ...TOOLS.compress, variant: "secondary" },
    ],
    "pdf-to-jpg": [
      { ...TOOLS.split, variant: "primary" },
      { ...TOOLS.merge, variant: "secondary" },
    ],
    "pdf-to-png": [
      { ...TOOLS.pdfToJpg, hint: "Try JPG export if PNG fails", variant: "primary" },
      { ...TOOLS.split, variant: "secondary" },
    ],
    "extract-images": [
      { ...TOOLS.pdfToPng, hint: "Try page-level PNG export", variant: "primary" },
      { ...TOOLS.pdfToJpg, hint: "Use JPG when smaller files matter", variant: "secondary" },
    ],
    "add-page-numbers": [
      { ...TOOLS.merge, hint: "Combine sections before numbering", variant: "primary" },
      { ...TOOLS.split, variant: "secondary" },
    ],
    "crop-pdf": [
      { ...TOOLS.split, hint: "Isolate readable pages", variant: "primary" },
      { ...TOOLS.pdfToJpg, variant: "secondary" },
    ],
    "add-watermark": [
      { ...TOOLS.split, variant: "primary" },
      { ...TOOLS.protect, hint: "Lock the file after watermarking", variant: "secondary" },
    ],
    "rotate-pdf": [
      { ...TOOLS.split, hint: "Fix only affected pages first", variant: "primary" },
      { ...TOOLS.pdfToJpg, hint: "Export pages if orientation still looks wrong", variant: "secondary" },
    ],
    "autocad-to-pdf": [
      { href: "/tools/crop-pdf/", label: "Try Crop PDF", hint: "Trim PDF margins after export", variant: "primary" },
      { ...TOOLS.compress, hint: "Compress large blueprint PDFs", variant: "secondary" },
    ],
    "openoffice-to-pdf": [
      { href: "/tools/word-to-pdf/", label: "Try Word to PDF", hint: "For .docx files from Microsoft Word", variant: "primary" },
      { ...TOOLS.compress, hint: "Compress the PDF before emailing", variant: "secondary" },
    ],
    "markdown-to-pdf": [
      { href: "/tools/openoffice-to-pdf/", label: "Try OpenOffice to PDF", hint: "For .odt open-source documents", variant: "primary" },
      { ...TOOLS.compress, hint: "Compress long PDF exports", variant: "secondary" },
    ],
    "html-to-pdf": [
      { href: "/tools/markdown-to-pdf/", label: "Try Markdown to PDF", hint: "For README and note exports", variant: "primary" },
      { ...TOOLS.compress, hint: "Shrink large rendered PDFs", variant: "secondary" },
    ],
    "ebook-to-pdf": [
      { href: "/tools/html-to-pdf/", label: "Try HTML to PDF", hint: "For chapter HTML exports", variant: "primary" },
      { ...TOOLS.compress, hint: "Reduce large book PDFs", variant: "secondary" },
    ],
    "iwork-to-pdf": [
      { href: "/tools/html-to-pdf/", label: "Try HTML to PDF", hint: "For manually exported web layouts", variant: "primary" },
      { ...TOOLS.compress, hint: "Compress exported presentation PDFs", variant: "secondary" },
    ],
    sign: [
      { ...TOOLS.protect, hint: "Lock the signed file after export", variant: "primary" },
      { ...TOOLS.merge, variant: "secondary" },
    ],
    "flatten-pdf": [
      { ...TOOLS.protect, hint: "Password-protect the flattened PDF", variant: "primary" },
      {
        href: "/tools/redact-pdf/",
        label: "Redact PDF",
        hint: "Black out secrets before flattening",
        variant: "secondary",
      },
    ],
    "remove-hidden-metadata": [
      {
        href: "/tools/redact-pdf/",
        label: "Redact PDF",
        hint: "Remove visible sensitive text",
        variant: "primary",
      },
      { ...TOOLS.protect, hint: "Lock the file after cleaning", variant: "secondary" },
    ],
    "pdf-password-recovery": [
      {
        href: "/tools/unlock-pdf/",
        label: "Unlock PDF",
        hint: "Use when you already know the password",
        variant: "primary",
      },
      { ...TOOLS.protect, hint: "Set a stronger password after unlock", variant: "secondary" },
    ],
    "batch-rename-pdf": [
      { ...TOOLS.merge, hint: "Combine files after renaming", variant: "primary" },
      { ...TOOLS.split, hint: "Split large PDFs into parts", variant: "secondary" },
    ],
    "pdf-to-booklet": [
      { ...TOOLS.merge, hint: "Merge chapters before imposing", variant: "primary" },
      { ...TOOLS.split, hint: "Split to fix page order first", variant: "secondary" },
      {
        href: "/tools/crop-pdf/",
        label: "Crop PDF",
        hint: "Trim margins before printing",
        variant: "secondary",
      },
    ],
    "compare-pdf": [
      { ...TOOLS.merge, hint: "Combine approved sections into one PDF", variant: "primary" },
      {
        href: "/tools/flatten-pdf/",
        label: "Flatten PDF",
        hint: "Lock down the final version after review",
        variant: "secondary",
      },
      {
        href: "/tools/redact-pdf/",
        label: "Redact PDF",
        hint: "Remove sensitive lines before sharing",
        variant: "secondary",
      },
    ],
    redact: [
      { ...TOOLS.protect, hint: "Lock the redacted file before sharing", variant: "primary" },
      {
        href: "/tools/flatten-pdf/",
        label: "Flatten PDF",
        hint: "Remove remaining editable layers",
        variant: "secondary",
      },
    ],
  };

  if (kind === "encrypted") {
    return {
      headline,
      detail: encryptedDetail,
      actions: withoutCurrent(encryptedActions, slug).slice(0, 3),
    };
  }

  if (kind === "corrupt") {
    return {
      headline,
      detail: corruptDetail,
      actions: withoutCurrent(corruptActions, slug).slice(0, 3),
    };
  }

  const generic = withoutCurrent(byOperation[operation] || encryptedActions, slug);
  return {
    headline,
    detail: genericDetail,
    actions: generic.slice(0, 3),
  };
}
