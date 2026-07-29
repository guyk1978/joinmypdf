import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `eml-to-pdf` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Need to convert email to PDF without uploading your inbox? JoinMyPDF’s EML to PDF Converter turns RFC 822 .eml messages into clean, printable documents entirely in your browser—our Zero-Upload Promise means the file never leaves your device. Save Outlook email as PDF after exporting a message, use this Thunderbird EML converter for archived threads, or read EML file online in a familiar page layout before you export. Headers (From, To, Cc, Subject, Date), HTML or plain-text bodies, and optional attachment filenames become a shareable PDF for records, support tickets, and legal archives—with no account and no server-side storage.",
  howTo: {
    name: "How to convert EML to PDF",
    description:
      "Convert a .eml email file into a printable PDF in your browser with JoinMyPDF—local parsing, live preview, and instant download under the Zero-Upload Promise.",
    steps: [
      {
        name: "Upload your .eml file",
        text: "Upload or drag and drop your .eml file into the converter.",
      },
      {
        name: "Review the parsed email",
        text: "Review the parsed email headers and body, then adjust page size, orientation, and fonts if needed.",
      },
      {
        name: "Convert and download",
        text: "Click convert and download your PDF instantly—processing stays on your device.",
      },
    ],
  },
  faq: [
    {
      question: "Is my .eml file uploaded to JoinMyPDF?",
      answer:
        "No. Parsing and PDF generation run entirely in your browser on your device. That is our Zero-Upload Promise—your email never reaches JoinMyPDF servers.",
    },
    {
      question: "Which email headers are included?",
      answer:
        "From, To, Cc (when present), Subject, and Date are extracted. You can hide headers before export if you only want the body.",
    },
    {
      question: "Does it support HTML email bodies?",
      answer:
        "Yes. HTML and plain-text bodies are rendered locally. Scripts and unsafe markup are stripped before preview and PDF capture.",
    },
    {
      question: "Are attachments embedded in the PDF?",
      answer:
        "Attachment binaries stay out of the PDF for safety. Optionally list attachment filenames in the document footer.",
    },
    {
      question: "Is the EML to PDF Converter free to use?",
      answer:
        "Yes. Standard in-browser conversion is free—no payment, trial watermark, or account required for everyday use.",
    },
    {
      question: "Do you add a watermark to the PDF?",
      answer:
        "No. JoinMyPDF does not stamp a watermark on EML to PDF downloads from this tool.",
    },
    {
      question: "Can I convert EML to PDF on mobile?",
      answer:
        "Yes. The converter works in modern mobile browsers on phones and tablets. For very large messages, a desktop browser usually offers more memory headroom.",
    },
    {
      question: "Are there file size or page limits?",
      answer:
        "There is no fixed JoinMyPDF upload quota because nothing is uploaded. Very large or image-heavy emails can still hit browser memory limits—try a smaller message, close other tabs, or convert one .eml at a time.",
    },
    {
      question: "Does EML to PDF work offline?",
      answer:
        "After the page loads once, conversion can continue without a network connection because processing stays in your browser. You still need network access for the first visit to load the app.",
    },
    {
      question: "Do I need an account to convert EML to PDF?",
      answer:
        "No account is required. Open the tool, add your .eml file, convert, and download the PDF when it is ready.",
    },
    {
      question: "What happens to my email file after I close the tab?",
      answer:
        "The working copy lives only in your browser session. Closing or refreshing the tab clears it from memory on your device—we do not retain your .eml or PDF on our servers.",
    },
    {
      question: "What file types and email clients are supported?",
      answer:
        "This tool accepts standard .eml (RFC 822) files. Export or save messages from Microsoft Outlook, Apple Mail, Mozilla Thunderbird, and similar clients that produce .eml, then convert them here to read EML file online as PDF.",
    },
    {
      question: "What should I do if conversion fails or freezes?",
      answer:
        "Confirm the file ends in .eml and opens in a mail client. Try a smaller message, disable heavy browser extensions, or re-export the email from Outlook, Apple Mail, or Thunderbird. If the preview is blank, the body may be empty or image-only—check the source message and try again.",
    },
    {
      question: "How does JoinMyPDF keep my emails private?",
      answer:
        "EML parsing and PDF rendering run locally in your browser tab. Combined with the Zero-Upload Promise, that keeps contracts, receipts, and personal threads off JoinMyPDF infrastructure during conversion.",
    },
  ],
};

export default documentation;
