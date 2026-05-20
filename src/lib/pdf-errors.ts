export type PdfErrorKind = "encrypted" | "corrupt" | "generic";

export class PdfProcessingError extends Error {
  readonly kind: PdfErrorKind;

  constructor(kind: PdfErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "PdfProcessingError";
    this.kind = kind;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function errorText(error: unknown): string {
  if (error instanceof PdfProcessingError && error.cause) {
    return `${error.message} ${errorText(error.cause)}`;
  }
  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }
  return String(error ?? "");
}

export function classifyPdfError(error: unknown): PdfProcessingError {
  if (error instanceof PdfProcessingError) return error;

  const text = errorText(error).toLowerCase();

  if (
    /encrypt|password|protected|needs.?a?.?password|passwordexception|security handler|not authorized/i.test(
      text
    )
  ) {
    return new PdfProcessingError(
      "encrypted",
      "This PDF appears to be password-protected.",
      error
    );
  }

  if (
    /invalid pdf|corrupt|damaged|parse|malformed|xref|missing pdf|failed to parse|format error/i.test(
      text
    )
  ) {
    return new PdfProcessingError(
      "corrupt",
      "This PDF may be corrupted or exported incorrectly.",
      error
    );
  }

  const fallback =
    error instanceof Error && error.message ? error.message : "Operation failed.";
  return new PdfProcessingError("generic", fallback, error);
}
