import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-resizer` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Every platform frames video differently. TikTok and Reels demand tall 9:16 stories; Instagram still loves a clean 1:1 square; YouTube remains the home of 16:9 landscape. Uploading the wrong shape means letterboxing, awkward auto-crops, or a rejected upload. A free online video resizer and cropper that runs in the browser lets you reframe once, preview exactly what will be kept, and download an MP4 ready for the feed—without sending private footage to a cloud editor. This guide covers resizing for TikTok, Reels, and YouTube, how aspect ratios really work, and why browser-based editing is often faster and safer than upload-first tools. Use the crop preview as your quality gate: if the bright rectangle cuts off a logo or face, change the preset or custom size before you spend time encoding.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Resizing and cropping run entirely in your browser inside a Web Worker. Your file never leaves your device."},{"question":"Which aspect ratios are supported?","answer":"Presets include 9:16 (TikTok/Reels), 1:1 (Instagram square), and 16:9 (YouTube), plus custom width × height."},{"question":"How does the crop preview work?","answer":"The tool shows a centered crop box on your video so you can see what will be kept before processing. FFmpeg then crops and scales with Lanczos, copying audio when possible."}],
};

export default documentation;
