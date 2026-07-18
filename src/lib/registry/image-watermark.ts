import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-watermark` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Once a photo leaves your drive, it can be screenshotted, reuploaded, and sold without credit. A free image watermark tool will not replace a legal strategy, but it makes ownership visible and discourages casual reuse — especially when the mark is baked into pixels before delivery.",
  faq: [
    {
      question: "Can I change the transparency?",
      answer:
        "Yes. Use the opacity slider for both text and logo watermarks. Lower values make the mark subtler; 100% is fully opaque.",
    },
    {
      question: "Is the logo preserved?",
      answer:
        "PNG logos with transparency keep their alpha channel when drawn on the canvas. The watermark is baked into the exported pixels — the original logo file itself is not modified.",
    },
    {
      question: "Does this tool work locally?",
      answer:
        "Yes. Images and logos are processed entirely in your browser with the HTML5 Canvas API. Nothing is uploaded.",
    },
    {
      question: "What does Auto-Scale Logo do?",
      answer:
        "It sets the logo width to about 10% of the current photo width so the mark looks proportional without manual dragging.",
    },
    {
      question: "Can I watermark multiple images?",
      answer:
        "Yes. Select several photos, tune the watermark once, then Apply & Download. Multiple outputs download as a ZIP.",
    },
    {
      question: "Is the Image Watermark tool free?",
      answer: "Yes. It is free to use with no account required.",
    },
  ],
};

export default documentation;
