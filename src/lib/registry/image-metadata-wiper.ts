import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-metadata-wiper` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Modern cameras and phones embed far more than pixels. EXIF and related metadata can reveal where a photo was taken, which device captured it, when it was shot, and which software touched it. A privacy-friendly image sanitizer lets you strip that trail before you publish, send, or archive photos — without uploading files to a remote cleaner.",
  faq: [{"question":"What is EXIF data?","answer":"EXIF is hidden metadata embedded in photos — camera model, capture time, GPS coordinates, software used, and more. It travels with the image even when you only see the picture."},{"question":"Are my photos uploaded to a server?","answer":"No. Inspection and wiping run entirely in your browser. Images never leave your device."},{"question":"Does this tool resize my image?","answer":"No. JPEG metadata is removed without re-encoding pixels. PNG metadata chunks are stripped while pixel data stays intact — dimensions and quality remain unchanged."},{"question":"Which formats are supported?","answer":"JPG/JPEG and PNG. Use those formats for the most private, quality-preserving wipe."},{"question":"Is the Image Metadata Wiper free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
