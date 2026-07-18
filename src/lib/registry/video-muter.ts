import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `video-muter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "A free online video muter that runs in the browser is the fastest way to strip sound from an MP4 without uploading footage. Marketers mute B-roll before laying a new voiceover. Creators remove copyrighted music before posting Reels. Teachers publish silent demos with captions only. With ffmpeg.wasm, the command is simple and powerful: drop audio with `-an`, copy the video bitstream with `-c:v copy`, and download a silent file that looks identical to the original. Because stream copy skips re-encoding, the job is nearly instant—even for large screen recordings—while privacy stays intact: processing never leaves your device. This guide covers how to remove audio from video online, why silent clips win on social platforms, and the security benefits of local-first video editing. Treat muting as a deliberate publish step: keep the soundtrack master when you might need it later, ship the muted derivative when platforms or partners demand silence, and never confuse the two when you measure “ready to post.”",
  faq: [{"question":"Is my video uploaded to JoinMyPDF?","answer":"No. Muting runs entirely in your browser with ffmpeg.wasm. Your file never leaves your device."},{"question":"Will video quality change?","answer":"No. Stream copy (-c:v copy) remuxes the video bitstream without re-encoding, so picture quality stays identical."},{"question":"Why is muting so fast?","answer":"Because -c:v copy does not re-encode frames—FFmpeg only drops the audio stream and writes a new container. Large files often finish in seconds."}],
};

export default documentation;
