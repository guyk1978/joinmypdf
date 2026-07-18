import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-trimmer` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Trimming a video used to mean installing desktop software or uploading a private clip to a stranger's cloud converter. Both options carry friction: installers that demand admin rights, and upload pipelines that copy your footage onto servers you do not control. A free online video trimmer that runs entirely in the browser changes that equation. This guide explains how to trim video online securely, how codecs and containers shape what a cut can do, and why client-side processing with tools like ffmpeg.wasm is becoming the default for privacy-first media utilities. Use it as a companion to the Free Online Video Trimmer above: set your in and out points locally, process on-device, and download without ever sending the file to JoinMyPDF.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Trimming runs entirely in your browser with ffmpeg.wasm. Your file never leaves your device."},{"question":"Which formats are supported?","answer":"MP4 (and M4V) input. Output is MP4 using stream copy (-c copy) for fast cuts without re-encoding."},{"question":"Will quality drop when I trim?","answer":"Stream copy keeps the original video and audio bitstreams. Cuts snap to keyframes, so ends may be a fraction of a second off from the exact slider values."}],
};

export default documentation;
