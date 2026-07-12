/**
 * Explicit Video Tools inventory (title / path / description).
 * Source of truth for the MP4 Tools hub grid and category sync checks.
 * Primary inventory for SEO/registry remains `assets/data/tools.json`.
 */

export type ToolsInventoryCategoryId = "video";

export type ToolsInventoryEntry = {
  /** Route slug under `/tools/{id}/` */
  id: string;
  title: string;
  path: string;
  description: string;
  category: ToolsInventoryCategoryId;
};

/** The 10 core video tools shown on MP4 Tools / All Tools Video column. */
export const VIDEO_TOOLS_INVENTORY = [
  {
    id: "video-trimmer",
    title: "Video Trimmer",
    path: "/tools/video-trimmer/",
    description:
      "Cut MP4 clips locally with a start/end range slider and ffmpeg.wasm stream copy. Preview in the browser, process on-device, and download—nothing is uploaded.",
    category: "video",
  },
  {
    id: "video-to-gif",
    title: "Video to GIF",
    path: "/tools/video-to-gif/",
    description:
      "Turn MP4, MOV, or WebM clips into animated GIFs locally. Choose start time, duration, FPS, and scale—palettegen/paletteuse runs in a Web Worker on your device.",
    category: "video",
  },
  {
    id: "video-resizer",
    title: "Video Resizer",
    path: "/tools/video-resizer/",
    description:
      "Resize and crop MP4 locally with aspect-ratio presets and custom dimensions. Center-crop preview, Lanczos scale, audio stream-copy—100% in your browser.",
    category: "video",
  },
  {
    id: "video-compressor",
    title: "MP4 Compressor",
    path: "/tools/video-compressor/",
    description:
      "Reduce MP4 file size locally with ffmpeg.wasm. Tune CRF (18–28), see original vs estimated size and bitrate, then download—100% in a Web Worker on your device.",
    category: "video",
  },
  {
    id: "video-to-mp3",
    title: "Video to MP3",
    path: "/tools/video-to-mp3/",
    description:
      "Convert MP4 and other videos to MP3 locally. Strip the video track with -vn and encode with libmp3lame (VBR q:a 2 or CBR bitrates)—all in a Web Worker on your device.",
    category: "video",
  },
  {
    id: "video-muter",
    title: "Video Muter",
    path: "/tools/video-muter/",
    description:
      "Remove the audio track from MP4 locally with ffmpeg.wasm. Uses -an -c:v copy for near-instant muting without re-encoding or uploading.",
    category: "video",
  },
  {
    id: "video-speed",
    title: "Video Speed Controller",
    path: "/tools/video-speed/",
    description:
      "Change MP4 playback speed locally with ffmpeg.wasm. Pick 0.5×, 0.75×, 1.5×, 2×, or 4×; video uses setpts and audio uses atempo—progress stays visible while Processing.",
    category: "video",
  },
  {
    id: "video-rotator",
    title: "Video Rotator",
    path: "/tools/video-rotator/",
    description:
      "Fix sideways phone footage locally. Rotate MP4 with 90° CW, 180°, or 90° CCW—fast metadata stream-copy when possible, or bake pixels with transpose.",
    category: "video",
  },
  {
    id: "video-metadata-cleaner",
    title: "Video Metadata Cleaner",
    path: "/tools/video-metadata-cleaner/",
    description:
      "Clean video metadata locally with -map_metadata -1 -c copy. Preview capture time, device model, and GPS before stripping—files never leave your browser.",
    category: "video",
  },
  {
    id: "video-converter",
    title: "Video Converter",
    path: "/tools/video-converter/",
    description:
      "Upload common video containers and convert to MP4, WebM, or MOV locally. MP4/MOV use libx264 + AAC for maximum compatibility; WebM uses VP9 + Opus.",
    category: "video",
  },
] as const satisfies readonly ToolsInventoryEntry[];

export type VideoToolsInventoryId = (typeof VIDEO_TOOLS_INVENTORY)[number]["id"];

export const VIDEO_TOOLS_INVENTORY_IDS = VIDEO_TOOLS_INVENTORY.map((tool) => tool.id);

export const TOOLS_INVENTORY_BY_CATEGORY = {
  video: VIDEO_TOOLS_INVENTORY,
} as const;

export function getVideoToolsInventoryEntry(
  id: string,
): (typeof VIDEO_TOOLS_INVENTORY)[number] | undefined {
  return VIDEO_TOOLS_INVENTORY.find((tool) => tool.id === id);
}
