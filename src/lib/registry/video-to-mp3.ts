import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-to-mp3` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Sometimes you only need the sound: a lecture recording, a podcast exported as MP4, a music bed trapped in a screen capture. A free online video to MP3 converter that runs in the browser extracts that track without uploading the file. FFmpeg’s `-vn` flag ignores video; `libmp3lame` with `-q:a 2` builds a high-quality VBR MP3 that sounds excellent for speech and music. This guide covers how to extract audio from video online, how MP3 compares to AAC, and why local-first extraction is faster and safer than cloud converters. Treat extraction as a deliberate publishing step: keep the video master for archives, ship the MP3 for listening, and never confuse the two when you measure “file size saved.” If a clip is long, trim to the useful segment first so you are not encoding minutes of silence or unused intros into the MP3.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Audio extraction runs entirely in your browser inside a Web Worker. Your file never leaves your device."},{"question":"What quality settings are available?","answer":"Default is high-quality VBR (-q:a 2). You can also choose CBR 128, 192, or 320 kbps."},{"question":"Which video formats work?","answer":"MP4, MOV, WEBM, MKV, AVI, and similar common containers with an audio track."}],
};

export default documentation;
