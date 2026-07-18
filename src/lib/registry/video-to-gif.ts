import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-to-gif` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Animated GIFs remain the quickest way to share a moment in chat, docs, and social posts—no player chrome, no autoplay politics, just looping pixels. Converting MP4 to GIF efficiently is less about hitting Convert and more about choosing the right window, frame rate, and width before the file balloons. This guide covers efficient MP4-to-GIF workflows, how to balance GIF quality against file size (including why palettegen and paletteuse matter), and why client-side browser conversion is the safer default. Use it alongside the Free Online Video to GIF Converter above: set start and duration, pick FPS and scale, preview the result, download when it looks right.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. GIF conversion runs entirely in your browser inside a Web Worker. Your file never leaves your device."},{"question":"How long can the video be?","answer":"Short clips (under ~30 seconds) work best in the browser. Use start time and duration to export only the moment you need."},{"question":"What GIF settings are used?","answer":"You choose FPS and scale width. Conversion uses Lanczos scaling plus a two-pass palettegen/paletteuse pipeline so colors stay sharp within GIF’s 256-color limit."}],
};

export default documentation;
