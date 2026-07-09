import exifr from "exifr";
import piexif from "piexifjs";
import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "./crop-image";

export { isAcceptedImageFile };

export type ImageMetadataFormValues = {
  title: string;
  artist: string;
  copyright: string;
  software: string;
  comment: string;
  dateTime: string;
  dateTimeOriginal: string;
};

export const IMAGE_METADATA_FORM_FIELDS: ReadonlyArray<{
  key: keyof ImageMetadataFormValues;
}> = [
  { key: "title" },
  { key: "artist" },
  { key: "copyright" },
  { key: "software" },
  { key: "comment" },
  { key: "dateTime" },
  { key: "dateTimeOriginal" },
];

export const EMPTY_IMAGE_METADATA_FORM: ImageMetadataFormValues = {
  title: "",
  artist: "",
  copyright: "",
  software: "",
  comment: "",
  dateTime: "",
  dateTimeOriginal: "",
};

const JPEG_QUALITY = 0.92;

function isJpegFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/jpeg" || ext === "jpg" || ext === "jpeg";
}

function formatExifDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}:${pad(value.getMonth() + 1)}:${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  return String(value);
}

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function emptyExifObject(): Record<string, unknown> {
  return { "0th": {}, Exif: {}, GPS: {}, "1st": {}, thumbnail: null };
}

function applyFormToExifObject(
  exifObj: Record<string, unknown>,
  values: ImageMetadataFormValues,
): Record<string, unknown> {
  const zeroth = (exifObj["0th"] as Record<number, string>) ?? {};
  const exif = (exifObj.Exif as Record<number, string>) ?? {};

  const set0 = (tag: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed) zeroth[tag] = trimmed;
    else delete zeroth[tag];
  };

  const setExif = (tag: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed) exif[tag] = trimmed;
    else delete exif[tag];
  };

  set0(piexif.ImageIFD.ImageDescription, values.title);
  set0(piexif.ImageIFD.Artist, values.artist);
  set0(piexif.ImageIFD.Copyright, values.copyright);
  set0(piexif.ImageIFD.Software, values.software);
  set0(piexif.ImageIFD.DateTime, values.dateTime);
  setExif(piexif.ExifIFD.DateTimeOriginal, values.dateTimeOriginal);
  setExif(piexif.ExifIFD.UserComment, values.comment);

  return { ...exifObj, "0th": zeroth, Exif: exif };
}

async function renderImageToJpegBytes(file: File): Promise<Uint8Array> {
  const imageSrc = await loadImageFileForCrop(file);
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas rendering is not supported in this browser.");
    }

    const width = Math.max(1, image.naturalWidth || image.width);
    const height = Math.max(1, image.naturalHeight || image.height);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Failed to export image."));
            return;
          }
          resolve(result);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    });

    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

/** Read editable EXIF fields from an image file. */
export async function readImageMetadataForm(file: File): Promise<ImageMetadataFormValues> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Choose a supported image file (JPG, PNG, WebP, HEIC, or GIF).");
  }

  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty. Choose another image.`);
  }

  try {
    const parsed = await exifr.parse(file, {
      pick: [
        "ImageDescription",
        "Artist",
        "Copyright",
        "Software",
        "DateTime",
        "DateTimeOriginal",
        "UserComment",
      ],
      reviveValues: false,
    });

    if (!parsed) {
      return { ...EMPTY_IMAGE_METADATA_FORM };
    }

    return {
      title: String(parsed.ImageDescription ?? ""),
      artist: String(parsed.Artist ?? ""),
      copyright: String(parsed.Copyright ?? ""),
      software: String(parsed.Software ?? ""),
      comment: String(parsed.UserComment ?? ""),
      dateTime: formatExifDate(parsed.DateTime),
      dateTimeOriginal: formatExifDate(parsed.DateTimeOriginal),
    };
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

/** Apply metadata form values and return an updated image blob. */
export async function applyImageMetadataUpdate(
  file: File,
  values: ImageMetadataFormValues,
): Promise<Blob> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Choose a supported image file (JPG, PNG, WebP, HEIC, or GIF).");
  }

  try {
    let jpegBytes: Uint8Array;

    if (isJpegFile(file)) {
      jpegBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      jpegBytes = await renderImageToJpegBytes(file);
    }

    const jpegBinary = bytesToBinary(jpegBytes);
    let exifObj: Record<string, unknown>;

    try {
      exifObj = piexif.load(jpegBinary) as Record<string, unknown>;
    } catch {
      exifObj = emptyExifObject();
    }

    exifObj = applyFormToExifObject(exifObj, values);
    const exifBytes = piexif.dump(exifObj);
    const updatedBinary = piexif.insert(exifBytes, jpegBinary);
    const updatedBytes = binaryToBytes(updatedBinary);

    return new Blob([updatedBytes as BlobPart], { type: "image/jpeg" });
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

/** Remove EXIF and other metadata by re-encoding the image locally. */
export async function stripImageMetadata(file: File): Promise<Blob> {
  if (!isAcceptedImageFile(file)) {
    throw new Error("Choose a supported image file (JPG, PNG, WebP, HEIC, or GIF).");
  }

  try {
    if (isJpegFile(file)) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const stripped = piexif.remove(bytesToBinary(bytes));
      return new Blob([binaryToBytes(stripped) as BlobPart], { type: "image/jpeg" });
    }

    const imageSrc = await loadImageFileForCrop(file);
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas rendering is not supported in this browser.");
      }

      const width = Math.max(1, image.naturalWidth || image.width);
      const height = Math.max(1, image.naturalHeight || image.height);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const type = file.type.toLowerCase();
      const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
      const mime =
        type === "image/png" || ext === "png"
          ? "image/png"
          : type === "image/webp" || ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      const quality = mime === "image/jpeg" ? JPEG_QUALITY : undefined;

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to export image without metadata."));
              return;
            }
            resolve(blob);
          },
          mime,
          quality,
        );
      });
    } finally {
      URL.revokeObjectURL(imageSrc);
    }
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export function imageMetadataEditorOutputName(file: File, stripped = false): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  if (stripped) {
    const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
    if (ext === "png") return `${slug}-no-metadata.png`;
    if (ext === "webp") return `${slug}-no-metadata.webp`;
    return `${slug}-no-metadata.jpg`;
  }

  if (isJpegFile(file)) {
    return `${slug}-metadata.jpg`;
  }

  return `${slug}-metadata.jpg`;
}
