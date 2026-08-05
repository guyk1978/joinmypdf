import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `color-palette-studio` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Color systems power brand recognition, accessibility, and UI consistency. A studio that combines harmony generation, image-based extraction, and WCAG contrast checks lets designers and developers iterate on palettes locally—without uploading brand assets to a third-party server.",
  faq: [
    {
      question: "Are my images or colors uploaded?",
      answer:
        "No. Palette generation, image extraction, and contrast checks run entirely in your browser. Nothing is sent to JoinMyPDF servers.",
    },
    {
      question: "What harmony modes are available?",
      answer:
        "Analogous, complementary, triadic, split-complementary, tetradic, and monochromatic. Each mode builds a five-color palette you can lock, tweak, and copy.",
    },
    {
      question: "How does image extraction work?",
      answer:
        "Your image is drawn to a canvas in the browser and quantized for dominant colors. You can copy HEX/RGB values or download the palette as JSON.",
    },
    {
      question: "What do the contrast ratings mean?",
      answer:
        "Ratios follow WCAG 2.x. AA normal text needs 4.5:1, AA large text needs 3:1, AAA normal needs 7:1, and AAA large needs 4.5:1.",
    },
    {
      question: "Is Color Palette Studio free?",
      answer: "Yes. It is free to use with no account required.",
    },
  ],
};

export default documentation;
