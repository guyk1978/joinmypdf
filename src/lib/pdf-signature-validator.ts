import * as pkijs from "pkijs";
import type { Certificate } from "pkijs";

export type SignatureValidationProgress = {
  phase: "reading" | "scanning" | "validating";
  currentSignature: number;
  totalSignatures: number;
};

export type SignatureValidationStatus = "valid" | "invalid" | "none";

export type PdfSignatureEntry = {
  index: number;
  status: "valid" | "invalid";
  signerName?: string;
  signingDate?: string;
  reason?: string;
  location?: string;
  subFilter?: string;
  message?: string;
};

export type PdfSignatureValidationReport = {
  overall: SignatureValidationStatus;
  signatures: PdfSignatureEntry[];
};

type ByteRange = [number, number, number, number];

type RawSignatureField = {
  byteRange: ByteRange;
  meta: SignatureMeta;
};

type SignatureMeta = {
  name?: string;
  date?: string;
  reason?: string;
  location?: string;
  subFilter?: string;
};

function bytesToLatin1(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i] ?? 0);
  }
  return out;
}

function decodePdfString(value: string): string {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, ch: string) => {
      if (ch === "n") return "\n";
      if (ch === "r") return "\r";
      if (ch === "t") return "\t";
      if (ch === "b") return "\b";
      if (ch === "f") return "\f";
      return ch;
    })
    .replace(/\\\r?\n/g, "")
    .trim();
}

function parsePdfDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(raw);
  if (!match) return raw;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00"] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}

function certCommonName(cert: Certificate): string | undefined {
  for (const entry of cert.subject.typesAndValues) {
    if (entry.type === "2.5.4.3") {
      return entry.value.toString();
    }
  }
  return undefined;
}

function signingTimeFromSigner(signerInfo: pkijs.SignerInfo): string | undefined {
  if (!signerInfo.signedAttrs) return undefined;
  for (const attr of signerInfo.signedAttrs.attributes) {
    if (attr.type !== "1.2.840.113549.1.9.5" || !attr.values[0]) continue;
    const value = attr.values[0].toString();
    if (/^\d{12}Z?$/.test(value)) {
      const y = value.slice(0, 4);
      const mo = value.slice(4, 6);
      const d = value.slice(6, 8);
      const h = value.slice(8, 10);
      const mi = value.slice(10, 12);
      const s = value.slice(12, 14) || "00";
      const parsed = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
    }
    return value;
  }
  return undefined;
}

function extractMetaNearByteRange(pdfText: string, byteRangeIndex: number): SignatureMeta {
  const start = Math.max(0, byteRangeIndex - 2000);
  const end = Math.min(pdfText.length, byteRangeIndex + 800);
  const chunk = pdfText.slice(start, end);

  const nameMatch =
    /\/Name\s*\(([^)]*)\)/.exec(chunk) ??
    /\/Name\s*<([0-9A-Fa-f]+)>/.exec(chunk);
  const dateMatch = /\/M\s*\(([^)]*)\)/.exec(chunk);
  const reasonMatch = /\/Reason\s*\(([^)]*)\)/.exec(chunk);
  const locationMatch = /\/Location\s*\(([^)]*)\)/.exec(chunk);
  const subFilterMatch = /\/SubFilter\s*\/([^\s/>]+)/.exec(chunk);

  let name = nameMatch?.[1] ? decodePdfString(nameMatch[1]) : undefined;
  if (nameMatch?.[0]?.includes("<") && nameMatch[1]) {
    try {
      const hex = nameMatch[1].replace(/\s/g, "");
      if (hex.length >= 4) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i += 1) {
          bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        if (bytes[0] === 0xfe && bytes[1] === 0xff) {
          name = new TextDecoder("utf-16be").decode(bytes.slice(2));
        }
      }
    } catch {
      // keep decoded name fallback
    }
  }

  return {
    name: name || undefined,
    date: dateMatch?.[1] ? parsePdfDate(decodePdfString(dateMatch[1])) : undefined,
    reason: reasonMatch?.[1] ? decodePdfString(reasonMatch[1]) : undefined,
    location: locationMatch?.[1] ? decodePdfString(locationMatch[1]) : undefined,
    subFilter: subFilterMatch?.[1],
  };
}

function isDigitalSignatureField(pdfText: string, byteRangeIndex: number): boolean {
  const start = Math.max(0, byteRangeIndex - 2500);
  const chunk = pdfText.slice(start, byteRangeIndex + 400);
  if (/\/Type\s*\/Sig\b/.test(chunk)) return true;
  if (/\/SubFilter\s*\/(adbe\.pkcs7\.detached|ETSI\.CAdES\.detached|adbe\.pkcs7\.sha1)/.test(chunk)) {
    return true;
  }
  if (/\/Filter\s*\/Adobe\.PPK(?:Lite|MS)\b/.test(chunk)) return true;
  return false;
}

function parseByteRanges(pdfText: string, pdfLength: number): RawSignatureField[] {
  const fields: RawSignatureField[] = [];
  const regex = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(pdfText)) !== null) {
    const index = match.index ?? 0;
    if (!isDigitalSignatureField(pdfText, index)) continue;

    const byteRange: ByteRange = [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
    ];
    const [start1, len1, start2, len2] = byteRange;
    if (len1 <= 0 || len2 <= 0 || start2 < start1 + len1 || start2 + len2 > pdfLength) continue;
    if (start2 - (start1 + len1) < 16) continue;

    fields.push({
      byteRange,
      meta: extractMetaNearByteRange(pdfText, index),
    });
  }

  return fields;
}

function extractPkcs7Bytes(pdfBytes: Uint8Array, byteRange: ByteRange): Uint8Array | null {
  const [start1, len1, start2] = byteRange;
  const contentsStart = start1 + len1;
  const contentsEnd = start2;
  if (contentsEnd <= contentsStart) return null;

  const slice = pdfBytes.subarray(contentsStart, contentsEnd);
  const text = bytesToLatin1(slice);
  const hexMatch = /<([0-9A-Fa-f\s]+)>/.exec(text);
  if (!hexMatch?.[1]) return null;

  const hex = hexMatch[1].replace(/\s/g, "").replace(/(?:00)+$/g, "");
  if (hex.length < 4 || hex.length % 2 !== 0) return null;

  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function buildSignedDocumentBytes(pdfBytes: Uint8Array, byteRange: ByteRange): Uint8Array {
  const [start1, len1, start2, len2] = byteRange;
  const head = pdfBytes.subarray(start1, start1 + len1);
  const tail = pdfBytes.subarray(start2, start2 + len2);
  const merged = new Uint8Array(head.length + tail.length);
  merged.set(head, 0);
  merged.set(tail, head.length);
  return merged;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function verifyPkcs7Signature(
  pkcs7Bytes: Uint8Array,
  signedDocumentBytes: Uint8Array,
): Promise<{ valid: boolean; signerName?: string; signingDate?: string; message?: string }> {
  try {
    const cms = pkijs.ContentInfo.fromBER(toArrayBuffer(pkcs7Bytes));
    if (cms.contentType !== pkijs.ContentInfo.SIGNED_DATA) {
      return { valid: false, message: "Unsupported signature container format." };
    }

    const signedData = new pkijs.SignedData({ schema: cms.content });
    const signerInfo = signedData.signerInfos[0];
    if (!signerInfo) {
      return { valid: false, message: "No signer information found in signature." };
    }

    let signerCert: Certificate | undefined;
    for (const cert of signedData.certificates ?? []) {
      if (cert instanceof pkijs.Certificate) {
        signerCert = cert;
        break;
      }
    }

    const valid = await signedData.verify({
      signer: 0,
      data: toArrayBuffer(signedDocumentBytes),
      checkChain: false,
    });

    const signingDate = signingTimeFromSigner(signerInfo);
    const signerName = signerCert ? certCommonName(signerCert) : undefined;

    if (valid === true) {
      return { valid: true, signerName, signingDate };
    }

    return {
      valid: false,
      signerName,
      signingDate,
      message: "Cryptographic signature verification failed.",
    };
  } catch (error) {
    if (error instanceof pkijs.SignedDataVerifyError) {
      const digestFailed = /digest doesn't match/i.test(error.message);
      return {
        valid: false,
        message: digestFailed
          ? "Document content was altered after signing."
          : error.message || "Signature verification failed.",
      };
    }
    if (error instanceof Error && /ASN/i.test(error.name)) {
      return { valid: false, message: "Could not parse PKCS#7 signature data." };
    }
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Signature verification failed.",
    };
  }
}

export async function validatePdfSignaturesFromFile(
  file: File,
  onProgress?: (progress: SignatureValidationProgress) => void,
): Promise<PdfSignatureValidationReport> {
  onProgress?.({ phase: "reading", currentSignature: 0, totalSignatures: 0 });

  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  if (pdfBytes.length === 0) {
    return { overall: "none", signatures: [] };
  }

  onProgress?.({ phase: "scanning", currentSignature: 0, totalSignatures: 0 });

  const pdfText = bytesToLatin1(pdfBytes);
  const rawFields = parseByteRanges(pdfText, pdfBytes.length);

  if (rawFields.length === 0) {
    return { overall: "none", signatures: [] };
  }

  const signatures: PdfSignatureEntry[] = [];
  let validCount = 0;

  for (let i = 0; i < rawFields.length; i += 1) {
    const field = rawFields[i]!;
    onProgress?.({
      phase: "validating",
      currentSignature: i + 1,
      totalSignatures: rawFields.length,
    });

    const pkcs7Bytes = extractPkcs7Bytes(pdfBytes, field.byteRange);
    if (!pkcs7Bytes) {
      signatures.push({
        index: i + 1,
        status: "invalid",
        ...field.meta,
        message: "Could not read PKCS#7 signature contents.",
      });
      continue;
    }

    const signedDocumentBytes = buildSignedDocumentBytes(pdfBytes, field.byteRange);
    const verification = await verifyPkcs7Signature(pkcs7Bytes, signedDocumentBytes);

    const entry: PdfSignatureEntry = {
      index: i + 1,
      status: verification.valid ? "valid" : "invalid",
      signerName: field.meta.name ?? verification.signerName,
      signingDate: field.meta.date ?? verification.signingDate,
      reason: field.meta.reason,
      location: field.meta.location,
      subFilter: field.meta.subFilter,
      message: verification.valid ? undefined : verification.message,
    };

    if (verification.valid) validCount += 1;
    signatures.push(entry);
  }

  const overall: SignatureValidationStatus =
    signatures.length === 0 ? "none" : validCount === signatures.length ? "valid" : "invalid";

  return { overall, signatures };
}
