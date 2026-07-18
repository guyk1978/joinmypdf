import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `svg-optimizer` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "SVG is the default format for icons, logos, and illustrative UI on the modern web. Unlike raster images, vectors scale cleanly at any resolution—but exported SVG files are often bloated with editor metadata, redundant groups, unused IDs, and verbose path data. That extra markup still travels over the network, still parses on the main thread, and still costs users on slow connections. This guide covers how to optimize SVG for web performance, why removing unnecessary metadata matters, and why SVGO became the industry standard. Use it alongside the Free Online SVG Optimizer above: minify locally, preview before and after, then ship leaner assets with confidence.",
  faq: [{"question":"Is my SVG uploaded to JoinMyPDF?","answer":"No. Optimization runs entirely in your browser with the official SVGO browser build."},{"question":"Will optimization change how my SVG looks?","answer":"Safe mode preserves viewBox and titles. Always check the before/after preview before downloading—aggressive settings can alter edge cases."},{"question":"Can I copy the optimized code?","answer":"Yes. Use Copy to Clipboard to paste the minified SVG into your editor or design system."}],
};

export default documentation;
