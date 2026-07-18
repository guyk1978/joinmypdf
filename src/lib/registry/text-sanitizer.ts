import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `text-sanitizer` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Copied PDF paragraphs and OCR exports rarely look like the original document. Soft line wraps break mid-sentence, tabs and double spaces scatter alignment, zero-width characters wreck search and paste targets, and Hebrew punctuation often drifts to the wrong side after an LTR clipboard hop. A local Text Sanitizer repairs those artifacts on your device so you can move clean prose into Word, Markdown, CMS fields, or translation workflows without sending confidential drafts to a remote cleanup API.",
  faq: [{"question":"Is my text uploaded to a server?","answer":"No. Cleanup runs entirely in your browser. Nothing is uploaded."},{"question":"What does Fix line breaks do?","answer":"It joins soft-wrapped lines that do not end with sentence punctuation (., !, ?) so paragraphs read as continuous prose again."},{"question":"What are invisible characters?","answer":"Zero-width spaces, BOM markers, soft hyphens, and other non-printable Unicode that often hitch a ride from PDFs and office apps and break rendering or search."},{"question":"How does Hebrew punctuation fixing work?","answer":"It moves sentence-ending marks that landed at the start of a Hebrew line back to the logical end — a common LTR/RTL drift after copy-paste."},{"question":"Is the Text Sanitizer free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
