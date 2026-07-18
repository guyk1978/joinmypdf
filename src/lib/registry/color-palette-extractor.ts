import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `color-palette-extractor` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "A consistent color system is the difference between a scattered UI and a brand that feels intentional. Extracting dominant colors from a photo — mood boards, packaging shots, or product heroes — gives you grounded HEX tokens instead of guessing from memory.",
  faq: [{"question":"How many colors are extracted?","answer":"By default we extract 8 dominant colors. Use the palette size slider to choose between 3 and 12 swatches."},{"question":"Is this accurate for all images?","answer":"Quantization finds prominent, recurring colors well. Busy photos, heavy gradients, or rare accent colors may produce approximate results — tune the color count if needed."},{"question":"Do I need to upload a small file?","answer":"No. High-resolution photos are downscaled on a hidden canvas before analysis so extraction stays fast without hanging the UI."},{"question":"Does this tool work locally?","answer":"Yes. Images never leave your device. ColorThief runs entirely in your browser on a canvas copy of your upload."},{"question":"Can I copy HEX and RGB?","answer":"Each swatch shows HEX and RGB. Click Copy (or the HEX code) to place the HEX value on your clipboard with a brief Copied confirmation."},{"question":"Is the Color Palette Extractor free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
