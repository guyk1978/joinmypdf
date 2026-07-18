import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Choosing a video container is no longer a niche engineering decision—it is a publishing decision. A free online video format converter that runs in the browser lets you turn camera cards, phone clips, and editor exports into files that actually play where your audience lives. This guide covers the best video formats for the web, why MP4 became the industry standard, and how to convert video formats locally without installing desktop software. The practical rule is simple: keep a master in whatever your camera or editor produces, then convert a delivery copy for the destination. When that conversion happens on-device with ffmpeg.wasm, you avoid uploads, waiting queues, and accidental leaks of unreleased footage.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Conversion runs entirely in your browser inside a Web Worker. Your file never leaves your device."},{"question":"Which output formats are available?","answer":"MP4 and MOV encode with libx264 video and AAC audio. WebM encodes with VP9 and Opus for browser-native WebM playback."},{"question":"Which input formats work?","answer":"Common containers including MOV, MKV, AVI, WMV, MP4, WEBM, and similar files your browser FFmpeg build can decode."}],
};

export default documentation;
