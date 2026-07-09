declare module "piexifjs" {
  const piexif: {
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
    load: (jpegData: string) => Record<string, unknown>;
    dump: (exifObj: Record<string, unknown>) => string;
    insert: (exifBytes: string, jpegData: string | Uint8Array) => string;
    remove: (jpegData: string) => string;
  };
  export default piexif;
}
