import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `color-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Color is one of the most reused tokens in modern product design. A single brand blue might appear as a hex code in a style guide, an rgb() value in a CSS custom property, and an hsl() triplet in a theme engine that generates lighter and darker variants. Understanding how HEX, RGB, and HSL differ—and when each format shines—helps designers and developers keep systems consistent, accessible, and easy to maintain. Teams that treat color as a shared contract between design and engineering ship fewer “almost right” buttons and fewer dark-mode surprises. This guide explains the three color spaces, their web-development use cases, how rounding and conversion can introduce tiny drifts, and how a local online color converter fits into everyday UI work without uploading confidential brand palettes to a third-party server.",
  faq: [{"question":"Is my color data uploaded?","answer":"No. Conversion runs entirely in your browser."},{"question":"Which formats are supported?","answer":"HEX, RGB, and HSL, plus a native color picker."},{"question":"Can I paste values into any field?","answer":"Yes. Update HEX, RGB, or HSL and the other formats refresh automatically."},{"question":"Is the Color Converter free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
