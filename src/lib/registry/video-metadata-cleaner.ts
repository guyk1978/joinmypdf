import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-metadata-cleaner` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "A free online video metadata cleaner that runs in the browser lets you see—and remove—hidden details before a clip leaves your device. Phones often embed capture time, device make and model, and GPS coordinates inside MP4 or MOV containers. Viewers of the video may never notice; forensic tools and social platforms sometimes do. FFmpeg’s `-map_metadata -1` combined with `-c copy` strips those tags without re-encoding, so cleaning stays near-instant even on large files. This guide covers why you should remove metadata from your videos, the privacy risks of sharing video files online, and how to protect location data when sharing media—while keeping every byte local. Before every public share, a simple habit—scan, preview, clean—prevents location and device leaks without harming video quality, because stream copy never re-encodes.",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Metadata cleaning runs entirely in your browser with ffmpeg.wasm. Your file never leaves your device."},{"question":"Will quality change?","answer":"No. Stream copy (-c copy) remuxes without re-encoding, so video and audio quality stay identical."},{"question":"What does the preview show?","answer":"Before cleaning, the tool scans the container for tags such as creation time, device make/model, and GPS so you can see what will be removed."}],
};

export default documentation;
