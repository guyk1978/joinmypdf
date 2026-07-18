import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-dpi-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "DPI (dots per inch) tells layout and print software how to map pixels onto physical paper. Updating density metadata is not the same as resizing an image. This online DPI changer writes the tag print workflows expect — especially 300 DPI — while leaving the photo’s pixel grid untouched.",
  faq: [{"question":"Does this change the image size?","answer":"No. Pixel width and height stay the same. Only density metadata (DPI) in the file header is updated — use Resize Image if you need different pixel dimensions."},{"question":"Will my image look pixelated?","answer":"Changing DPI does not resample pixels, so on-screen appearance stays the same. Softness in print comes from too few pixels for the physical print size, not from this metadata tag alone."},{"question":"Is the original quality preserved?","answer":"Yes. JPG and PNG payloads are not re-compressed. JPEG updates EXIF/JFIF density; PNG updates the pHYs chunk."},{"question":"What does Print Ready do?","answer":"It sets the target to 300 DPI — the common commercial print standard — so you do not have to pick a preset manually."},{"question":"Does this tool work locally?","answer":"Yes. All metadata changes run in your browser. Nothing is uploaded."},{"question":"Is the Image DPI Converter free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
