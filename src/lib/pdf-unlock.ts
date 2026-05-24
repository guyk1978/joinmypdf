import { EncryptedPDFError, PDFDocument } from "pdf-lib-with-encrypt";

export class IncorrectPasswordError extends Error {
  constructor() {
    super("Incorrect password. Please try again.");
    this.name = "IncorrectPasswordError";
  }
}

function isWrongPasswordFailure(error: unknown): boolean {
  if (error instanceof IncorrectPasswordError) return true;
  const text =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? "");
  return /incorrect password|wrong password|invalid password|bad password|password.*(fail|invalid|incorrect|wrong)|decrypt|authentication/i.test(
    text,
  );
}

/** True when the PDF has an /Encrypt dictionary (may still open without a user password). */
export async function isPdfEncrypted(bytes: Uint8Array): Promise<boolean> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.isEncrypted;
  } catch {
    return false;
  }
}

/** Remove password protection and return an unencrypted PDF. */
export async function unlockPdfBytes(source: Uint8Array, password: string): Promise<Uint8Array> {
  const trimmed = String(password || "");
  try {
    const loadOptions = trimmed ? { password: trimmed } : {};
    const doc = await PDFDocument.load(source, loadOptions);
    return doc.save({ useObjectStreams: false });
  } catch (error) {
    if (error instanceof EncryptedPDFError) {
      if (!trimmed) throw error;
      throw new IncorrectPasswordError();
    }
    if (trimmed && isWrongPasswordFailure(error)) {
      throw new IncorrectPasswordError();
    }
    throw error;
  }
}
