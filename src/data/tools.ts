import { AudioNormalizer } from "@/components/tools/AudioNormalizer";
import { FadeInOutCreator } from "@/components/tools/FadeInOutCreator";
import { Mp3SpeedChanger } from "@/components/tools/Mp3SpeedChanger";
import { VoiceRemover } from "@/components/tools/VoiceRemover";
import { AudioMerger } from "@/components/tools/AudioMerger";
import { AudioCompressor } from "@/components/tools/AudioCompressor";
import { Mp3MetadataEditor } from "@/components/tools/Mp3MetadataEditor";
import { Mp3Compressor } from "@/components/tools/Mp3Compressor";
import { Mp3Converter } from "@/components/tools/Mp3Converter";
import { Mp3ToWav } from "@/components/tools/Mp3ToWav";
import { Mp3Trimmer } from "@/components/tools/Mp3Trimmer";
import { Mp3VolumeBooster } from "@/components/tools/Mp3VolumeBooster";
import { WavToMp3 } from "@/components/tools/WavToMp3";
import { FlacConverter } from "@/components/tools/FlacConverter";
import { OggConverter } from "@/components/tools/OggConverter";
import { Mp3ToMp4 } from "@/components/tools/Mp3ToMp4";
import { Mp4ToMp3 } from "@/components/tools/Mp4ToMp3";
import { M4aConverter } from "@/components/tools/M4aConverter";
import type { ToolListEntry } from "@/lib/tool-module";

/**
 * Central registry for audio utilities.
 * Swap a Placeholder entry with a real component import to ship a new tool.
 */
export const toolsList: ToolListEntry[] = [
  {
    id: "mp3-converter",
    name: "MP3 Converter",
    title: "Convert audio to MP3 locally",
    iconKey: "arrow-left-right",
    component: Mp3Converter,
  },
  {
    id: "audio-compressor",
    name: "Audio Compressor",
    title: "Reduce your audio file size significantly without leaving your browser. Fast, secure, and private.",
    iconKey: "minimize-2",
    component: AudioCompressor,
  },
  {
    id: "mp3-compressor",
    name: "MP3 Compressor",
    title: "Reduce your MP3 file size by adjusting the bitrate. Maintain control over quality and file size locally in your browser.",
    iconKey: "file-audio",
    component: Mp3Compressor,
  },
  {
    id: "wav-to-mp3",
    name: "WAV to MP3 Converter",
    title: "Turn lossless WAV into compact MP3 instantly. No server uploads, 100% private and local.",
    iconKey: "file-audio",
    component: WavToMp3,
  },
  {
    id: "mp3-to-wav",
    name: "MP3 to WAV",
    title: "Export MP3 sources to uncompressed WAV",
    iconKey: "music",
    component: Mp3ToWav,
  },
  {
    id: "mp3-trimmer",
    name: "MP3 Trimmer",
    title: "Cut and trim MP3 files by start and end time. Preview, set mm:ss points, and download locally with ffmpeg.wasm — 100% private.",
    iconKey: "scissors",
    component: Mp3Trimmer,
  },
  {
    id: "mp4-to-mp3",
    name: "MP4 to MP3",
    title:
      "Extract audio from MP4 videos as high-quality MP3 locally. Strip the video track and download audio — 100% private browser processing.",
    iconKey: "file-audio",
    component: Mp4ToMp3,
  },
  {
    id: "mp3-to-mp4",
    name: "MP3 to MP4",
    title:
      "Turn an MP3 and cover image into a shareable MP4 video for YouTube and social media. 100% local and private ffmpeg.wasm processing.",
    iconKey: "file-music",
    component: Mp3ToMp4,
  },
  {
    id: "ogg-converter",
    name: "OGG Converter",
    title: "Convert OGG Vorbis and Opus files to MP3 locally in your browser. No uploads, no server processing, 100% private.",
    iconKey: "audio-waveform",
    component: OggConverter,
  },
  {
    id: "flac-converter",
    name: "FLAC Converter",
    title:
      "Transcode your lossless FLAC files to MP3, WAV, or other formats locally. High-quality output, 100% private and secure.",
    iconKey: "disc",
    component: FlacConverter,
  },
  {
    id: "m4a-converter",
    name: "M4A Converter",
    title:
      "Convert your M4A and AAC audio tracks to MP3 or WAV quickly and securely. 100% local browser-based processing.",
    iconKey: "file-music",
    component: M4aConverter,
  },
  {
    id: "mp3-volume-booster",
    name: "MP3 Volume Booster",
    title: "Boost your MP3 volume to professional levels without quality loss. All processing is 100% local and private.",
    iconKey: "volume-2",
    component: Mp3VolumeBooster,
  },
  {
    id: "mp3-metadata-editor",
    name: "MP3 Metadata Editor (ID3)",
    title: "Edit your MP3 tags, including title, artist, album, and album art directly in your browser. Fast, secure, and 100% private.",
    iconKey: "tags",
    component: Mp3MetadataEditor,
  },
  {
    id: "audio-merger",
    name: "Audio Merger",
    title: "Combine multiple MP3 files into one seamless audio track locally. Fast, secure, and 100% private.",
    iconKey: "music",
    component: AudioMerger,
  },
  {
    id: "voice-remover",
    name: "Voice Remover (Instrumental Maker)",
    title: "Isolate instrumentals by removing vocals from your audio tracks locally. 100% private, no server processing.",
    iconKey: "audio-waveform",
    component: VoiceRemover,
  },
  {
    id: "mp3-speed-changer",
    name: "MP3 Speed Changer",
    title: "Change the playback speed of your MP3 files without altering the pitch. Perfect for podcasts and audiobooks. 100% private and local.",
    iconKey: "file-music",
    component: Mp3SpeedChanger,
  },
  {
    id: "fade-in-out-creator",
    name: "Fade In/Out Creator",
    title: "Add professional fade-in and fade-out effects to your audio files locally. Fast, secure, and 100% private.",
    iconKey: "audio-waveform",
    component: FadeInOutCreator,
  },
  {
    id: "audio-normalizer",
    name: "Audio Normalizer",
    title:
      "Unify the volume levels of your MP3 files effortlessly. Perfect for creating consistent-sounding playlists. 100% private and local processing.",
    iconKey: "volume-2",
    component: AudioNormalizer,
  },
];
