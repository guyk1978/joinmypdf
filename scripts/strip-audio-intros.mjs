/**
 * Remove leading documentation intros from audio tool interaction components.
 * Keeps algorithm disclaimers / control hints (e.g. VoiceRemover amber box).
 */
import fs from "node:fs";
import path from "node:path";

const files = [
  "src/components/tools/Mp3Converter.tsx",
  "src/components/tools/Mp3Trimmer.tsx",
  "src/components/tools/AudioTrimmer.tsx",
  "src/components/tools/Mp3VolumeBooster.tsx",
  "src/components/tools/AudioCompressor.tsx",
  "src/components/tools/Mp3Compressor.tsx",
  "src/components/tools/WavToMp3.tsx",
  "src/components/tools/Mp3ToWav.tsx",
  "src/components/tools/Mp4ToMp3.tsx",
  "src/components/tools/Mp3ToMp4.tsx",
  "src/components/tools/OggConverter.tsx",
  "src/components/tools/FlacConverter.tsx",
  "src/components/tools/M4aConverter.tsx",
  "src/components/tools/Mp3MetadataEditor.tsx",
  "src/components/tools/AudioMerger.tsx",
  "src/components/tools/VoiceRemover.tsx",
  "src/components/tools/Mp3SpeedChanger.tsx",
  "src/components/tools/FadeInOutCreator.tsx",
  "src/components/tools/AudioNormalizer.tsx",
  "src/components/tools/SilenceRemover.tsx",
];

const INTRO_RE =
  /\r?\n\s*<p className="text-sm leading-relaxed text-neutral-400">[\s\S]*?<\/p>\r?\n/;

let changed = 0;
for (const relative of files) {
  const filePath = path.join(process.cwd(), relative);
  const before = fs.readFileSync(filePath, "utf8");
  if (!INTRO_RE.test(before)) {
    console.warn("no intro match", relative);
    continue;
  }
  const after = before.replace(INTRO_RE, "\n");
  fs.writeFileSync(filePath, after, "utf8");
  changed += 1;
  console.log("stripped", relative);
}
console.log(`Updated ${changed}/${files.length}`);
