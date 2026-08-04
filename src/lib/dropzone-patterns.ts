/**
 * Tool-specific monochrome dropzone interior patterns (SVG data URLs).
 * Subtle black line-art on transparent — tiled behind CHOOSE FILES.
 */

export type DropzonePatternKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "default";

function svgDataUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}")`;
}

/** Fine pixel grid + schematic resize handles (image / resize tools). */
const PATTERN_IMAGE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none">
  <g stroke="#111" stroke-width="0.6" opacity="0.55">
    <path d="M0 16H128M0 32H128M0 48H128M0 64H128M0 80H128M0 96H128M0 112H128"/>
    <path d="M16 0V128M32 0V128M48 0V128M64 0V128M80 0V128M96 0V128M112 0V128"/>
  </g>
  <g stroke="#111" stroke-width="1.15" fill="none">
    <rect x="74" y="74" width="40" height="32" rx="1"/>
    <path d="M74 90H114M94 74V106" stroke-dasharray="2 2" opacity="0.7"/>
  </g>
  <g fill="#111">
    <rect x="72" y="72" width="4.5" height="4.5"/>
    <rect x="111.5" y="72" width="4.5" height="4.5"/>
    <rect x="72" y="103.5" width="4.5" height="4.5"/>
    <rect x="111.5" y="103.5" width="4.5" height="4.5"/>
    <rect x="90.75" y="72" width="4.5" height="4.5"/>
    <rect x="90.75" y="103.5" width="4.5" height="4.5"/>
    <rect x="72" y="87.75" width="4.5" height="4.5"/>
    <rect x="111.5" y="87.75" width="4.5" height="4.5"/>
  </g>
</svg>
`);

/** Stacked document icons + page layout guides (PDF / document tools). */
const PATTERN_PDF = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" fill="none">
  <g stroke="#111" stroke-width="1.1">
    <rect x="28" y="36" width="42" height="54" rx="2"/>
    <path d="M54 36V48H66"/>
    <rect x="36" y="44" width="42" height="54" rx="2" opacity="0.55"/>
    <rect x="44" y="52" width="42" height="54" rx="2" opacity="0.35"/>
  </g>
  <g stroke="#111" stroke-width="0.7" opacity="0.45">
    <path d="M98 24V116M114 24V116"/>
    <path d="M86 40H126M86 56H126M86 72H126M86 88H126"/>
  </g>
  <g stroke="#111" stroke-width="0.9" opacity="0.5">
    <path d="M52 64H66M52 72H70M52 80H62"/>
  </g>
</svg>
`);

/** Filmstrip perforations + play schematic (video tools). */
const PATTERN_VIDEO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="148" height="96" viewBox="0 0 148 96" fill="none">
  <rect x="10" y="18" width="128" height="60" rx="3" stroke="#111" stroke-width="1.2"/>
  <g fill="#111">
    <rect x="16" y="24" width="6" height="8" rx="1"/>
    <rect x="16" y="40" width="6" height="8" rx="1"/>
    <rect x="16" y="56" width="6" height="8" rx="1"/>
    <rect x="126" y="24" width="6" height="8" rx="1"/>
    <rect x="126" y="40" width="6" height="8" rx="1"/>
    <rect x="126" y="56" width="6" height="8" rx="1"/>
  </g>
  <path d="M34 18V78M58 18V78M82 18V78M106 18V78" stroke="#111" stroke-width="0.7" opacity="0.4"/>
  <path d="M68 40L86 48L68 56Z" fill="#111" opacity="0.75"/>
</svg>
`);

/** Soft waveform / bar motif (audio tools). */
const PATTERN_AUDIO = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96" viewBox="0 0 128 96" fill="none">
  <g stroke="#111" stroke-width="1.2" stroke-linecap="round" opacity="0.55">
    <path d="M18 48V36M26 48V28M34 48V40M42 48V22M50 48V34M58 48V26M66 48V42M74 48V20M82 48V32M90 48V38M98 48V24M106 48V44"/>
    <path d="M18 48V60M26 48V68M34 48V56M42 48V74M50 48V62M58 48V70M66 48V54M74 48V76M82 48V64M90 48V58M98 48V72M106 48V52"/>
  </g>
  <circle cx="64" cy="48" r="10" stroke="#111" stroke-width="1" fill="none" opacity="0.35"/>
</svg>
`);

/** Fine cross-hatch (general / default tools). */
const PATTERN_DEFAULT = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <path d="M-4 12L12 -4M-4 28L28 -4M-4 44L44 -4M4 52L52 4M20 52L52 20M36 52L52 36"
    stroke="#111" stroke-width="0.55" opacity="0.45"/>
  <path d="M-4 36L36 76M-4 20L20 44M-4 4L4 12M12 -4L52 36M28 -4L52 20M44 -4L52 4"
    stroke="#111" stroke-width="0.55" opacity="0.28"/>
</svg>
`);

const PATTERN_BY_KIND: Record<DropzonePatternKind, string> = {
  image: PATTERN_IMAGE,
  pdf: PATTERN_PDF,
  video: PATTERN_VIDEO,
  audio: PATTERN_AUDIO,
  default: PATTERN_DEFAULT,
};

/**
 * Map a tool slug + inventory category onto a dropzone pattern family.
 */
export function resolveDropzonePatternKind(
  slug?: string | null,
  categoryId?: string | null,
): DropzonePatternKind {
  const s = (slug || "").toLowerCase();
  const c = (categoryId || "").toLowerCase();

  // Slug wins for media-specific tools (e.g. video-compressor tagged compress).
  if (
    /^(resize-image|crop-image|rotate-image|compress-image|convert-to-png|webp-to-jpg|image-|favicon|png-to|ico-to|apple-touch|transparent-favicon|svg-to-favicon)/.test(
      s,
    ) ||
    /image|jpg|png|webp|heic|favicon|watermark|dpi|grayscale|blur|redact|combiner/.test(s)
  ) {
    return "image";
  }
  if (
    /video|mp4-tools|to-gif|video-muter|video-trimmer|video-resizer|video-rotator|video-speed|video-compressor|video-converter|video-to-mp3|video-to-mp4|video-metadata/.test(
      s,
    )
  ) {
    return "video";
  }
  if (
    /audio|mp3|wav|flac|ogg|m4a|voice-remover|volume-booster|normalizer|fade-in|audio-trimmer|audio-compressor/.test(
      s,
    )
  ) {
    return "audio";
  }
  if (
    /pdf|merge|split|word-to|excel-to|powerpoint|epub|xps|booklet|protect-pdf|unlock-pdf|sign-pdf|annotate|flatten|repair-pdf|extract-|ocr|pdf-reader|page-numbers|reorder|delete-pdf|n-up|grayscale-pdf|linearization|pdf-a|metadata-editor|safe-to-share|remove-hidden/.test(
      s,
    )
  ) {
    return "pdf";
  }

  if (c === "image" || c === "jpg" || c === "png" || c === "favicon" || c === "crop" || c === "rotate") {
    return "image";
  }
  if (c === "video" || c === "mp4") return "video";
  if (c === "audio" || c === "mp3") return "audio";
  if (c === "pdf" || c === "word" || c === "excel" || c === "convert" || c === "extract" || c === "security") {
    return "pdf";
  }

  return "default";
}

export function getDropzonePatternDataUrl(
  kind: DropzonePatternKind,
  /** `dark` = light strokes for patterned frames behind the white upload box. */
  surface: "light" | "dark" = "light",
): string {
  const base = PATTERN_BY_KIND[kind] ?? PATTERN_DEFAULT;
  if (surface === "dark") {
    // Patterns are URI-encoded with `#111` → `%23111`.
    return base.replaceAll("%23111", "%23f2f2f2");
  }
  return base;
}

export function getDropzonePatternBackgroundSize(kind: DropzonePatternKind): string {
  switch (kind) {
    case "image":
      return "128px 128px";
    case "pdf":
      return "140px 140px";
    case "video":
      return "148px 96px";
    case "audio":
      return "128px 96px";
    default:
      return "48px 48px";
  }
}
