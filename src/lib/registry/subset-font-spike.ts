import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `subset-font-spike` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Subset only the glyphs you actually use, reduce transfer size, and keep complete control over your files with local-first browser processing. Large font files are a common cause of slow website performance; subsetting helps eliminate Flash of Unstyled Text and improves Core Web Vitals without uploading brand assets to a server.",
  faq: [
    {
      question: "What is font subsetting?",
      answer:
        "Font subsetting is the process of removing unused characters (glyphs) from a font file. This significantly reduces file size while keeping only the characters needed for your website's language and content.",
    },
    {
      question: "Why should I subset my fonts?",
      answer:
        "Large font files are a common cause of slow website performance. Subsetting helps eliminate 'Flash of Unstyled Text' (FOUT) and improves your Google PageSpeed scores.",
    },
    {
      question: "Is this tool safe to use?",
      answer:
        "Yes. All processing happens 100% locally in your browser. Your font files are never uploaded to a server, ensuring complete privacy and security.",
    },
    {
      question: "Which font formats are supported?",
      answer: "We currently support TTF, OTF, and WOFF2 formats.",
    },
  ],
};

export default documentation;
