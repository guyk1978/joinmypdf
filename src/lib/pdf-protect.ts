import { PDFDocument } from "pdf-lib-with-encrypt";

const DEFAULT_PERMISSIONS = {
  printing: "highResolution" as const,
  modifying: false,
  copying: false,
  annotating: false,
  fillingForms: false,
  contentAccessibility: false,
  documentAssembly: false,
};

/** Password-protect PDF bytes in-browser (pure JS, no WASM). */
export async function protectPdfBytes(source: Uint8Array, password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  await doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: DEFAULT_PERMISSIONS,
  });
  return doc.save({ useObjectStreams: false });
}
