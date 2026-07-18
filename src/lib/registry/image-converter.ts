import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Every modern product ships images: product photos, hero banners, avatars, Open Graph cards, documentation screenshots, and email headers. The format you choose quietly decides how fast a page feels, how large a CDN bill grows, and whether a teammate on Windows can open the file at all. This guide explains why WebP often wins for web performance, how JPG, PNG, WebP, and HEIC fit different compatibility needs, and why converting images locally in the browser—never uploading them—matters for privacy and trust. Use it as a practical companion to the Free Online Image Converter above: convert on your device, then ship the right bytes for the job.",
  faq: [{"question":"Is my image uploaded to JoinMyPDF?","answer":"No. Conversion runs entirely in your browser on your device."},{"question":"Which formats can I convert?","answer":"Upload JPG, PNG, WebP, GIF, BMP, or HEIC/HEIF. Export to WebP, PNG, or JPG. HEIC inputs from iPhone are decoded locally with heic2any."},{"question":"Can I export true HEIC files?","answer":"Browsers cannot encode HEIC. Choosing HEIC exports a high-quality JPEG instead. HEIC is fully supported as an input format."}],
};

export default documentation;
