declare module "browser-image-compression" {
  export type ImageCompressionOptions = {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
    initialQuality?: number;
    preserveExif?: boolean;
    onProgress?: (progress: number) => void;
  };

  export default function imageCompression(
    file: File,
    options?: ImageCompressionOptions,
  ): Promise<File>;
}
