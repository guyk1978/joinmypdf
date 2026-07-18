import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-compressor` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Large MP4s clog email, slow landing pages, and frustrate teammates on mobile networks. Compressing a video “without losing quality” does not mean mathematically lossless—it means choosing a Constant Rate Factor (CRF) where viewers cannot tell the difference while the file drops dramatically. A free online MP4 video compressor that runs in the browser lets you dial CRF between 18 and 28, compare original versus estimated size and bitrate, and download a leaner file without uploading footage to a stranger’s cloud. This guide covers practical quality-preserving compression, what bitrate and CRF really mean, and why local browser compression is the safest way to shrink files. When stakeholders argue about “looking bad,” show them the CRF value and the before/after bitrate instead of debating vibes—numbers settle quality-versus-size conversations faster.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Compression runs entirely in your browser inside a Web Worker. Your file never leaves your device."},{"question":"What is CRF?","answer":"Constant Rate Factor controls quality vs size for libx264. Lower CRF (around 18–20) keeps more detail; higher CRF (around 26–28) makes smaller files. Values between 18 and 28 are ideal for standard web video."},{"question":"What format is the output?","answer":"Compressed videos download as MP4 using libx264 with preset medium—compatible with common players and platforms."}],
};

export default documentation;
