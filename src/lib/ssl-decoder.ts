import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

export type SslDecodedField = {
  key: string;
  label: string;
  value: string;
};

export type SslDecodeResult = {
  fields: SslDecodedField[];
};

export type SslDecodeErrorCode = "empty" | "invalid" | "parse";

const DN_OID_LABELS: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.4": "SN",
  "2.5.4.5": "serialNumber",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.9": "street",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.12": "title",
  "1.2.840.113549.1.9.1": "emailAddress",
};

const ALGO_OID_LABELS: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.10045.2.1": "EC",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
};

function pemToDer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  if (!cleaned) {
    throw new Error("empty");
  }

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function rdnValue(entry: pkijs.AttributeTypeAndValue): string {
  const block = entry.value?.valueBlock as { value?: unknown } | undefined;
  if (block && typeof block.value === "string" && block.value.length > 0) {
    return block.value;
  }
  const raw = entry.value.toString();
  const quoted = /:\s*'([^']*)'\s*$/.exec(raw);
  return quoted?.[1] ?? raw;
}

function formatName(name: pkijs.RelativeDistinguishedNames): string {
  const parts: string[] = [];
  for (const entry of name.typesAndValues) {
    const label = DN_OID_LABELS[entry.type] ?? entry.type;
    parts.push(`${label}=${rdnValue(entry)}`);
  }
  return parts.join(", ") || "—";
}

function formatDate(value: Date): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "—";
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function algorithmLabel(oid: string | undefined): string {
  if (!oid) return "—";
  return ALGO_OID_LABELS[oid] ?? oid;
}

function publicKeyBits(spki: pkijs.PublicKeyInfo): string {
  try {
    const key = spki.parsedKey;
    if (key && "modulus" in key && key.modulus) {
      const modulus = key.modulus as asn1js.Integer;
      const hex = modulus.valueBlock.valueHexView;
      return `${hex.byteLength * 8}`;
    }
    if (key && "x" in key && key.x) {
      const x = key.x as ArrayBuffer;
      return `${x.byteLength * 8}`;
    }
  } catch {
    // Fall through to unknown.
  }
  return "—";
}

function buildFields(
  cert: pkijs.Certificate,
  labels: {
    issuer: string;
    subject: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    signatureAlgorithm: string;
    publicKeyAlgorithm: string;
    publicKeySize: string;
    version: string;
  },
): SslDecodedField[] {
  const spki = cert.subjectPublicKeyInfo;
  return [
    { key: "subject", label: labels.subject, value: formatName(cert.subject) },
    { key: "issuer", label: labels.issuer, value: formatName(cert.issuer) },
    { key: "validFrom", label: labels.validFrom, value: formatDate(cert.notBefore.value) },
    { key: "validTo", label: labels.validTo, value: formatDate(cert.notAfter.value) },
    { key: "serialNumber", label: labels.serialNumber, value: cert.serialNumber.valueBlock.toString() },
    {
      key: "signatureAlgorithm",
      label: labels.signatureAlgorithm,
      value: algorithmLabel(cert.signatureAlgorithm.algorithmId),
    },
    {
      key: "publicKeyAlgorithm",
      label: labels.publicKeyAlgorithm,
      value: algorithmLabel(spki.algorithm.algorithmId),
    },
    {
      key: "publicKeySize",
      label: labels.publicKeySize,
      value: publicKeyBits(spki),
    },
    {
      key: "version",
      label: labels.version,
      value: String((cert.version ?? 0) + 1),
    },
  ];
}

export type SslFieldLabels = {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  publicKeySize: string;
  version: string;
};

export function decodeSslCertificate(
  raw: string,
  fieldLabels: SslFieldLabels,
): { ok: true; result: SslDecodeResult } | { ok: false; code: SslDecodeErrorCode } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, code: "empty" };

  try {
    const der = pemToDer(trimmed);
    const asn1 = asn1js.fromBER(der);
    if (asn1.offset === -1 || !asn1.result) {
      return { ok: false, code: "invalid" };
    }

    const cert = new pkijs.Certificate({ schema: asn1.result });
    return {
      ok: true,
      result: { fields: buildFields(cert, fieldLabels) },
    };
  } catch {
    return { ok: false, code: "parse" };
  }
}
