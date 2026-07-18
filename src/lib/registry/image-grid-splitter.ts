import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-grid-splitter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "An online image splitter turns one strong photo into a set of matching tiles. Creators use this for Instagram grid drops, carousel storytelling, and mood-board collages — without installing desktop editors.",
  faq: [{"question":"Does it maintain image quality?","answer":"Yes. Tiles are cropped from the original pixels with the Canvas API. PNG exports stay lossless; JPEG sources export high-quality JPEG tiles (quality ~95)."},{"question":"Can I split into non-square grids?","answer":"Yes. Use presets like 1×3 or 3×1, or enter any custom rows and columns from 1 to 10 (for example 2×5)."},{"question":"Is the processing done on my device?","answer":"Yes. Slicing and ZIP packaging run entirely in your browser. Nothing is uploaded."},{"question":"How should I post an Instagram grid?","answer":"Use the 3×3 preset, download the ZIP, then upload tiles in numbered order (left to right, top to bottom) so the feed reconstructs the full image."},{"question":"Is the Image Grid Splitter free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
