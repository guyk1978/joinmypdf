import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `rotate-image` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Crooked scans and sideways phone photos rarely need three different apps. The Rotate & Align Suite keeps orthogonal snaps, precision degrees, mirrors, and Auto-Align deskew in one Industrial Matte workspace — processed entirely on your device.",
  faq: [{"question":"Is my image uploaded to JoinMyPDF?","answer":"No. Rotation, flips, and auto-deskew run entirely in your browser on your device."},{"question":"Can I rotate by angles other than 90°?","answer":"Yes. Use Precision Rotation to enter custom degrees (for example 45°), or keep Quick Rotate for 90°/180° snaps."},{"question":"What does Auto-Align do?","answer":"Auto-Align estimates a small deskew angle with a local projection-profile scan (edge/line alignment), then applies that correction. It is designed for slightly crooked scanned documents — not as a full OCR pipeline."},{"question":"Can I flip and rotate together?","answer":"Yes. Toggle Flip Horizontal / Flip Vertical alongside your rotation angle, preview the result, then download once."},{"question":"Where do I rotate PDFs or videos?","answer":"Use Rotate PDF for page orientation of PDF documents and Video Rotator for MP4 clips. Both are linked from the suite sidebar and the Rotate Tools hub."},{"question":"Will image quality be preserved?","answer":"Export uses high-quality canvas rendering with smoothing enabled. Extreme arbitrary angles resample pixels; 90° snaps stay sharply orthogonal."}],
};

export default documentation;
