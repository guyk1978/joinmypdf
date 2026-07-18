import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `image-blur-redact` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Support tickets, dashboards, and phone photos often include names, addresses, account numbers, and faces you never meant to publish. An image redactor that runs locally lets you blur screenshots online and censor images free — without uploading confidential pixels to a remote service.",
  faq: [{"question":"Is my image sent to a server?","answer":"No. Drawing, blur, pixelate, and solid redaction run entirely in your browser. The image never leaves your device."},{"question":"Can I undo the blur?","answer":"Yes. Use Undo to remove the last region, Clear all to reset effects, or Replace image to start over from the original file."},{"question":"What formats are supported?","answer":"JPG, PNG, WebP, GIF, and HEIC. Downloads keep JPEG/WebP quality when possible and use PNG for GIF/other cases."},{"question":"What does Auto-Detect Faces do?","answer":"It is experimental. On supported Chromium browsers it uses the built-in Face Detector API to suggest blur regions. If the API is unavailable, the button explains that and you can still redact manually."},{"question":"Is the Image Blur & Redact tool free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
