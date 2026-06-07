export type UpsellCard = {
  href: string;
  card: string;
};

/** Maps tool operations to suggested follow-up cards (translation keys under PostSuccessUpsell.cards). */
export const POST_SUCCESS_UPSELL: Record<string, UpsellCard[]> = {
  merge: [
    { href: "/tools/pdf-compress/", card: "compressEmail" },
    { href: "/tools/pdf-split/", card: "splitFewPages" },
  ],
  compress: [{ href: "/tools/pdf-merge/", card: "bundleMerge" }],
  split: [{ href: "/tools/pdf-merge/", card: "recombineMerge" }],
  "crop-pdf": [
    { href: "/tools/add-watermark/", card: "draftWatermark" },
    { href: "/tools/pdf-compress/", card: "compressEmail" },
  ],
  "add-watermark": [
    { href: "/tools/protect-pdf/", card: "passwordProtect" },
    { href: "/tools/pdf-compress/", card: "compressSharing" },
  ],
  "rotate-pdf": [
    { href: "/tools/crop-pdf/", card: "trimMargins" },
    { href: "/tools/add-watermark/", card: "markDrafts" },
  ],
  "autocad-to-pdf": [
    { href: "/tools/crop-pdf/", card: "trimBlueprint" },
    { href: "/tools/pdf-compress/", card: "compressEmail" },
  ],
  "openoffice-to-pdf": [
    { href: "/tools/pdf-compress/", card: "compressEmailOpenOffice" },
    { href: "/tools/word-to-pdf/", card: "convertingWord" },
  ],
  "markdown-to-pdf": [
    { href: "/tools/pdf-compress/", card: "compressMarkdown" },
    { href: "/tools/openoffice-to-pdf/", card: "openOfficeDocs" },
  ],
  "html-to-pdf": [
    { href: "/tools/markdown-to-pdf/", card: "convertingMarkdown" },
    { href: "/tools/pdf-compress/", card: "compressSharing" },
  ],
  "ebook-to-pdf": [
    { href: "/tools/pdf-compress/", card: "compressLongExports" },
    { href: "/tools/html-to-pdf/", card: "webLayoutExports" },
  ],
  "iwork-to-pdf": [
    { href: "/tools/pdf-compress/", card: "compressSharing" },
    { href: "/tools/word-to-pdf/", card: "alsoDocx" },
  ],
  "add-page-numbers": [
    { href: "/tools/protect-pdf/", card: "protectNumbered" },
    { href: "/tools/pdf-compress/", card: "compressEmail" },
  ],
  "delete-pages": [
    { href: "/tools/pdf-merge/", card: "combineTrimmed" },
    { href: "/tools/pdf-compress/", card: "compressBeforeSend" },
  ],
  "reorder-pdf-pages": [
    { href: "/tools/extract-pdf-pages/", card: "extractPages" },
    { href: "/tools/delete-pdf-pages/", card: "combineTrimmed" },
  ],
  "extract-pdf-pages": [
    { href: "/tools/reorder-pdf-pages/", card: "extractPages" },
    { href: "/tools/pdf-split/", card: "fullPageExports" },
  ],
  protect: [
    { href: "/tools/pdf-compress/", card: "shrinkAfterProtect" },
    { href: "/tools/pdf-merge/", card: "bundleThenLock" },
  ],
  unlock: [
    { href: "/tools/protect-pdf/", card: "relockPassword" },
    { href: "/tools/pdf-compress/", card: "compressUnlocked" },
  ],
  "pdf-password-recovery": [
    { href: "/tools/unlock-pdf/", card: "alreadyKnowPassword" },
    { href: "/tools/protect-pdf/", card: "strongerPassword" },
    { href: "/tools/pdf-compress/", card: "compressBeforeSend" },
  ],
  sign: [
    { href: "/tools/protect-pdf/", card: "protectSigned" },
    { href: "/tools/pdf-compress/", card: "compressSending" },
  ],
  redact: [
    { href: "/tools/protect-pdf/", card: "protectBeforeSend" },
    { href: "/tools/pdf-compress/", card: "compressRedacted" },
  ],
  "flatten-pdf": [
    { href: "/tools/protect-pdf/", card: "protectFlattened" },
    { href: "/tools/redact-pdf/", card: "hideSensitiveFirst" },
    { href: "/tools/sign-pdf/", card: "signAfterFlatten" },
  ],
  "remove-hidden-metadata": [
    { href: "/tools/redact-pdf/", card: "redactVisible" },
    { href: "/tools/protect-pdf/", card: "protectCleanPdf" },
    { href: "/tools/flatten-pdf/", card: "flattenForms" },
  ],
  "custom-paper-margin": [
    { href: "/tools/pdf-to-booklet/", card: "printBooklet" },
    { href: "/tools/rotate-pdf/", card: "rotatePages" },
    { href: "/tools/pdf-merge/", card: "mergeChapters" },
  ],
  "safe-to-share-auditor": [
    { href: "/tools/redact-pdf/", card: "fineTuneRedact" },
    { href: "/tools/remove-hidden-metadata/", card: "removeMetadata" },
    { href: "/tools/flatten-pdf/", card: "flattenFinal" },
  ],
  "pdf-to-booklet": [
    { href: "/tools/crop-pdf/", card: "cropBeforePrint" },
    { href: "/tools/pdf-merge/", card: "mergeSectionsFirst" },
    { href: "/tools/pdf-split/", card: "splitUnwanted" },
  ],
  "compare-pdf": [
    { href: "/tools/pdf-merge/", card: "mergeApproved" },
    { href: "/tools/flatten-pdf/", card: "flattenFinalVersion" },
    { href: "/tools/redact-pdf/", card: "redactSensitive" },
  ],
  "batch-rename-pdf": [
    { href: "/tools/pdf-merge/", card: "mergeRenamed" },
    { href: "/tools/pdf-split/", card: "splitOversized" },
    { href: "/tools/delete-pdf-pages/", card: "deleteExtraPages" },
  ],
  "pdf-text-editor": [
    { href: "/tools/add-watermark/", card: "markDrafts" },
    { href: "/tools/sign-pdf/", card: "protectSigned" },
    { href: "/tools/protect-pdf/", card: "passwordProtect" },
  ],
  "annotate-pdf": [
    { href: "/tools/sign-pdf/", card: "protectSigned" },
    { href: "/tools/pdf-text-editor/", card: "editableDocument" },
    { href: "/tools/compare-pdf/", card: "mergeApproved" },
  ],
  "png-to-pdf": [
    { href: "/tools/pdf-compress/", card: "compressPdf" },
    { href: "/tools/jpg-to-pdf/", card: "alsoJpgPhotos" },
  ],
  "heic-to-pdf": [
    { href: "/tools/jpg-to-pdf/", card: "haveJpgPhotos" },
    { href: "/tools/pdf-compress/", card: "compressPdf" },
  ],
  "pdf-to-png": [
    { href: "/tools/png-to-pdf/", card: "pngBackToPdf" },
    { href: "/tools/pdf-to-jpg/", card: "preferJpg" },
  ],
  "pdf-to-text": [
    { href: "/tools/pdf-to-word/", card: "editableDocument" },
    { href: "/tools/pdf-split/", card: "extractPages" },
    { href: "/tools/pdf-merge/", card: "combineBeforeExtract" },
  ],
  "extract-images": [
    { href: "/tools/pdf-to-jpg/", card: "fullPageExports" },
    { href: "/tools/pdf-to-text/", card: "needTextToo" },
    { href: "/tools/pdf-merge/", card: "combineDocumentsFirst" },
  ],
  "jpg-to-pdf": [{ href: "/tools/pdf-compress/", card: "optimizeSharing" }],
  "pdf-to-jpg": [{ href: "/tools/pdf-compress/", card: "optimizeSharing" }],
};
