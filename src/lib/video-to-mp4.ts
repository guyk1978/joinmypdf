const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|mkv|avi|mpeg|mpg|wmv|flv|3gp)$/i;

export const VIDEO_TO_MP4_ACCEPT =
  "video/*,.mp4,.m4v,.mov,.webm,.mkv,.avi,.mpeg,.mpg,.wmv,.flv,.3gp";

export function isAcceptedVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.test(file.name);
}

export function videoToMp4OutputName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/i, "").trim() || "video";
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "video";
  return `${safe}.mp4`;
}

export function downloadVideoBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
