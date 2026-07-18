import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `pdf-editor` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Scanned contracts, faxed forms, and image-only PDFs still dominate sensitive workflows—and they usually have no selectable text layer. The old shortcut was to upload them to a cloud OCR suite. That expands custody risk. JoinMyPDF’s Advanced OCR-based Editor keeps the entire path local: render pages in the browser, run tesseract.js OCR inside a Web Worker, edit the result in a rich text view beside the original Reference View, and rebuild a downloadable PDF with pdf-lib—without uploading a byte.",
  faq: [{"question":"Is my PDF uploaded to JoinMyPDF?","answer":"No. OCR and PDF generation run in Web Workers inside your browser. Your file never leaves your device."},{"question":"How does the advanced editor work?","answer":"Upload a PDF, run OCR with tesseract.js, edit the extracted text in the rich editor, then Save & Download a new PDF built with pdf-lib."},{"question":"Can I see the original PDF while editing?","answer":"Yes. Reference View shows the original page on the left while Edit View keeps the editable text on the right."},{"question":"Will the UI freeze during OCR?","answer":"Heavy OCR and PDF export run in Web Workers with a Processing progress bar so the main UI stays responsive."}],
};

export default documentation;
