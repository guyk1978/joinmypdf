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
    "pdf-to-jpg": [
      { ...TOOLS.split, variant: "primary" },
      { ...TOOLS.merge, variant: "secondary" },
    ],
    "pdf-to-png": [
      { ...TOOLS.pdfToJpg, hint: "Try JPG export if PNG fails", variant: "primary" },
      { ...TOOLS.split, variant: "secondary" },
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
