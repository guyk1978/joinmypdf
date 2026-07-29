import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `delete-pdf-pages` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Need to remove pages from PDF online without sending the file to the cloud? JoinMyPDF’s Delete PDF Pages tool lets you delete specific PDF pages in your browser—our Zero-Upload Promise means multi-page documents stay on your device. Cut pages from PDF browser workflows when you need to strip blank sheets, extra scans, or unneeded attachments, or extract or remove PDF sheets from a long report before sharing. Preview every page as a thumbnail, mark what goes, and download a cleaned PDF with fonts and layout intact on the pages you keep—no account, no server queues, and no upload size anxiety.",
  howTo: {
    name: "How to delete pages from a PDF",
    description:
      "Remove unwanted pages from a multi-page PDF in your browser with JoinMyPDF—local thumbnail selection and instant download under the Zero-Upload Promise.",
    steps: [
      {
        name: "Upload your PDF",
        text: "Upload or drag and drop your PDF file into the tool.",
      },
      {
        name: "Select pages to remove",
        text: "Preview the document and select the unwanted pages or page ranges you want to remove.",
      },
      {
        name: "Process and download",
        text: "Click process and download your updated PDF instantly—processing stays on your device.",
      },
    ],
  },
  faq: [
    {
      question: "Is my PDF uploaded to JoinMyPDF servers?",
      answer:
        "No. Page removal runs entirely in your browser. That is our Zero-Upload Promise—your file never leaves your device.",
    },
    {
      question: "Can I delete multiple pages at once?",
      answer:
        "Yes. Mark any combination of pages or ranges from the thumbnail preview, then process once to remove them all.",
    },
    {
      question: "Can I delete every page?",
      answer:
        "No. At least one page must remain in the output PDF so you always download a valid document.",
    },
    {
      question: "Will fonts and layout stay intact on remaining pages?",
      answer:
        "Yes. Remaining pages are preserved from the original file without re-compressing content—only the pages you mark are stripped.",
    },
    {
      question: "Is Delete PDF Pages free to use?",
      answer:
        "Yes. Standard in-browser page removal is free—no payment, trial watermark, or account required for everyday use.",
    },
    {
      question: "Do you add a watermark after deleting pages?",
      answer:
        "No. JoinMyPDF does not stamp a watermark on PDFs downloaded from this tool.",
    },
    {
      question: "Can I remove pages from PDF on mobile?",
      answer:
        "Yes. The interface works in modern mobile browsers. For very large multi-page files, a desktop browser usually offers more memory headroom.",
    },
    {
      question: "Are there file size or page limits?",
      answer:
        "There is no fixed JoinMyPDF upload quota because nothing is uploaded. Very large PDFs can still hit browser memory limits—try closing other tabs, or split the file first and delete pages from smaller parts.",
    },
    {
      question: "Does page deletion work offline?",
      answer:
        "After the page loads once, you can keep working without a network connection because processing stays in your browser. You still need network access for the first visit.",
    },
    {
      question: "Do I need an account to delete PDF pages?",
      answer:
        "No account is required. Open the tool, add your PDF, select pages to remove, and download the cleaned file.",
    },
    {
      question: "What happens to my PDF after I close the tab?",
      answer:
        "The working copy lives only in your browser session. Closing or refreshing the tab clears it from memory—we do not retain your PDF on our servers.",
    },
    {
      question: "What kinds of pages can I safely strip?",
      answer:
        "Use it on multi-page documents to cut blank sheets, duplicate scans, cover sheets, appendix pages, or unneeded attachments from the page grid—all locally under the Zero-Upload Promise.",
    },
    {
      question: "What should I do if deletion fails or freezes?",
      answer:
        "Try a smaller PDF, disable heavy browser extensions, or unlock a password-protected file first. If the grid will not load, re-export the PDF from the source app and try again.",
    },
    {
      question: "How does JoinMyPDF keep page removal private?",
      answer:
        "Selection and deletion run locally in your browser tab. Combined with the Zero-Upload Promise, that keeps contracts, scans, and personal PDFs off JoinMyPDF infrastructure during editing.",
    },
  ],
};

export default documentation;
