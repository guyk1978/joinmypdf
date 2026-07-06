export type { IMediaTool } from "./IMediaTool";
export {
  MediaProcessingError,
  extensionFromFile,
  mimeFromExtension,
  secondsToFfmpegTimestamp,
  VIDEO_TO_MP4_DEFAULT_CRF,
  VIDEO_COMPRESS_CRF_BY_LEVEL,
  resolveVideoCompressCrf,
} from "./media.types";
export type {
  AudioCompressOptions,
  AudioConvertOptions,
  AudioExtractOptions,
  MediaKind,
  MediaMetadata,
  MediaProcessingPhase,
  MediaProgress,
  VideoCompressionLevel,
  VideoCompressOptions,
  VideoConvertOptions,
  VideoToMp4Options,
  VideoTrimOptions,
} from "./media.types";
