import QRCode, { type QRCodeErrorCorrectionLevel } from "qrcode";

export type QrCodeSize = "small" | "medium" | "large";
export type QrErrorCorrection = "low" | "medium" | "high";

export type QrCodeRenderOptions = {
  size: QrCodeSize;
  errorCorrection: QrErrorCorrection;
  foregroundColor: string;
};

export const QR_SIZE_PIXELS: Record<QrCodeSize, number> = {
  small: 200,
  medium: 320,
  large: 480,
};

export const QR_ERROR_LEVEL: Record<QrErrorCorrection, QRCodeErrorCorrectionLevel> = {
  low: "L",
  medium: "M",
  high: "H",
};

export const QR_FOREGROUND_PRESETS = [
  "#000000",
  "#1f2937",
  "#1e3a5f",
  "#1a4d2e",
  "#4a1c2e",
] as const;

export const DEFAULT_QR_FOREGROUND = "#000000";
export const QR_BACKGROUND = "#ffffff";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_PATTERN.test(color.trim());
}

export function normalizeHexColor(color: string, fallback = DEFAULT_QR_FOREGROUND): string {
  const trimmed = color.trim();
  if (isValidHexColor(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return fallback;
}

export async function renderQrCodeToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrCodeRenderOptions,
): Promise<void> {
  const content = text.trim();
  if (!content) return;

  await QRCode.toCanvas(canvas, content, {
    width: QR_SIZE_PIXELS[options.size],
    errorCorrectionLevel: QR_ERROR_LEVEL[options.errorCorrection],
    color: {
      dark: normalizeHexColor(options.foregroundColor),
      light: QR_BACKGROUND,
    },
    margin: 2,
  });
}

export async function copyCanvasAsPng(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) return false;

  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename = "qrcode.png"): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
