import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `favicon-generator` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "A favicon is the tiny mark in browser tabs, bookmarks, and history lists. It is often the first brand cue users see after the page title — which is why a free favicon creator that starts from your real logo beats a generic letter glyph for production sites.",
  faq: [{"question":"What is an ICO file?","answer":"An ICO is a Windows icon container that can store multiple PNG frames (for example 16×16, 32×32, and 48×48) in one favicon.ico file. Browsers pick an appropriate size for tabs and bookmarks."},{"question":"Do I need different sizes?","answer":"Yes for crisp results. Small tabs use 16×16; many UIs use 32×32; shortcuts often prefer 48×48. Our multi-size ICO packs all three. Modern sites can also use separate PNG links."},{"question":"How do I add this to my website?","answer":"Place favicon.ico (or the PNG files) in your site root or /public folder, then paste the generated <link rel=\"icon\"> snippet into your HTML <head>."},{"question":"Which formats can I upload?","answer":"PNG, JPG/JPEG, and SVG. Everything is resized and packed in your browser — nothing is uploaded."},{"question":"Is the Favicon Generator free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
