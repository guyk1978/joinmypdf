const OUTPUT_BY_SLUG: Record<string, string> = {
  "video-to-mp4": "MP4",
  "video-compressor": "MP4",
  "heic-to-jpg": "JPG",
  "convert-to-png": "PNG",
  "png-to-ico": "ICO",
  "ico-to-png": "PNG",
  "svg-to-favicon": "ICO",
  "jpg-to-pdf": "PDF",
  "png-to-pdf": "PDF",
  "heic-to-pdf": "PDF",
  "pdf-compress": "PDF",
  "compress-image": "Image",
};

function inputExtension(file: File): string {
  const match = file.name.match(/\.[^.]+$/);
  if (match) return match[0].toUpperCase();
  const subtype = file.type.split("/")[1];
  return subtype ? `.${subtype.toUpperCase()}` : "FILE";
}

/** Build a concise technical hint for bug reports (e.g. ".MOV → MP4"). */
export function buildFeedbackFileContext(
  file: File,
  options?: { slug?: string; outputLabel?: string },
): string {
  const input = inputExtension(file);
  const output = options?.outputLabel ?? (options?.slug ? OUTPUT_BY_SLUG[options.slug] : undefined);
  if (output) return `${input} → ${output}`;
  return `${file.name} (${input})`;
}
