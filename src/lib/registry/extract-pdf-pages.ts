import type { ToolDocumentation } from "@/lib/types";

/**
 * Documentation overlay for `extract-pdf-pages` — owned by the registry, not the tool UI.
 * Editorial SEO copy: overview, HowTo steps, and tailored FAQs.
 */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Long PDFs rarely need to travel whole. JoinMyPDF’s Extract PDF Pages tool helps you extract pages from PDF online when you only need a chapter, invoice block, or exhibit set—without uploading the source file. Under our Zero-Upload Promise, you save specific PDF pages as a new compact document entirely in your browser: pick exact numbers or ranges such as 1, 3-5, 12, preview the selection, and download a clean subset while fonts and images stay sharp. Prefer to split PDF by page range instead of shipping a 40-page packet? Enter the ranges once, extract, and share only what the recipient should see. Whether you are pulling statements from a bank export, isolating signature pages from a contract, or packaging academic appendices for a separate email, local range extraction keeps the workflow fast, private, and free of server queues or account walls.",
  howTo: {
    name: "How to extract pages from a PDF",
    description:
      "Isolate specific pages or ranges from a multi-page PDF in your browser with JoinMyPDF—local selection, lossless page copy, and instant download under the Zero-Upload Promise.",
    steps: [
      {
        name: "Upload your PDF locally",
        text: "Upload or drag and drop your PDF file locally into the extractor.",
      },
      {
        name: "Select pages or ranges",
        text: "Select specific page numbers or ranges (e.g., 1, 3-5) to isolate the pages you need.",
      },
      {
        name: "Extract and download",
        text: "Click extract and instantly download your new compact PDF—processing stays on your device.",
      },
    ],
  },
  faq: [
    {
      question: "What page range format is supported?",
      answer:
        "Use comma-separated pages and dashes for ranges, like 1, 3-5, 8. That lets you extract pages from PDF online with precise control over every sheet that lands in the new file.",
    },
    {
      question: "Is extraction processed locally?",
      answer:
        "Yes. Pages are copied into a new PDF entirely in your browser. That is our Zero-Upload Promise—the source file never reaches JoinMyPDF servers.",
    },
    {
      question: "Will extracted pages lose quality?",
      answer:
        "No. Pages are copied from the source file without re-encoding, so text, vector art, and images stay as sharp as the originals.",
    },
    {
      question: "Can I extract the same page twice?",
      answer:
        "Yes. Repeat a page number in your specification if you need duplicates in the output order.",
    },
    {
      question: "Is Extract PDF Pages free to use?",
      answer:
        "Yes. Standard in-browser extraction is free—no payment, trial watermark, or account required for everyday use.",
    },
    {
      question: "Do you add a watermark to extracted PDFs?",
      answer:
        "No. JoinMyPDF does not stamp a watermark on PDFs downloaded from this tool.",
    },
    {
      question: "Can I save specific PDF pages on mobile?",
      answer:
        "Yes. The extractor works in modern mobile browsers. For very large multi-page files, a desktop browser usually offers more memory headroom.",
    },
    {
      question: "Are there file size or page limits?",
      answer:
        "There is no fixed JoinMyPDF upload quota because nothing is uploaded. Very large PDFs can still hit browser memory limits—try closing other tabs, or extract a smaller range first.",
    },
    {
      question: "Does page extraction work offline?",
      answer:
        "After the page loads once, you can keep working without a network connection because processing stays in your browser. You still need network access for the first visit.",
    },
    {
      question: "Do I need an account to extract PDF pages?",
      answer:
        "No account is required. Open the tool, add your PDF, enter pages or ranges, extract, and download the new file.",
    },
    {
      question: "What happens to my PDF after I close the tab?",
      answer:
        "The working copy lives only in your browser session. Closing or refreshing the tab clears it from memory—we do not retain your PDF on our servers.",
    },
    {
      question: "When should I extract pages instead of splitting the whole file?",
      answer:
        "Use extraction when you want to save specific PDF pages or split PDF by page range into one compact deliverable—ideal for exhibits, invoice sections, and appendices—while leaving the original document untouched on your device.",
    },
    {
      question: "What should I do if extraction fails or freezes?",
      answer:
        "Confirm page numbers fall within the document length, try a smaller range, disable heavy browser extensions, or unlock a password-protected PDF first. Re-export from the source app if the file will not open.",
    },
    {
      question: "How does JoinMyPDF keep page extraction private?",
      answer:
        "Range parsing and page copying run locally in your browser tab. Combined with the Zero-Upload Promise, that keeps contracts, statements, and personal PDFs off JoinMyPDF infrastructure during extraction.",
    },
  ],
};

export default documentation;
