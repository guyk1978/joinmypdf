import { jwtDecode, InvalidTokenError } from "jwt-decode";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type JwtWarningType = "expired" | "signature_malformed" | "signature_unverified" | "alg_none";

export type JwtWarning = {
  type: JwtWarningType;
  exp?: number;
};

export type JwtSection = {
  raw: string;
  formatted: string;
  json?: Record<string, unknown>;
};

export type JwtParseSuccess = {
  ok: true;
  header: JwtSection;
  payload: JwtSection;
  signature: { raw: string };
  warnings: JwtWarning[];
  exp?: number;
};

export type JwtParseFailure = {
  ok: false;
  error: string;
};

export type JwtParseResult = JwtParseSuccess | JwtParseFailure;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return atob(padded);
}

function decodeJsonSegment(segment: string): { json: Record<string, unknown>; formatted: string } {
  const decoded = base64UrlDecode(segment);
  const json = JSON.parse(decoded) as Record<string, unknown>;
  return { json, formatted: JSON.stringify(json, null, 2) };
}

function isValidBase64Url(segment: string): boolean {
  return BASE64URL_PATTERN.test(segment) && segment.length > 0;
}

function splitJwt(token: string): [string, string, string] | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) return null;
  return [header, payload, signature];
}

function collectWarnings(
  headerJson: Record<string, unknown>,
  payloadJson: Record<string, unknown>,
  signaturePart: string,
): JwtWarning[] {
  const warnings: JwtWarning[] = [];
  const alg = typeof headerJson.alg === "string" ? headerJson.alg : "";

  if (alg.toLowerCase() === "none") {
    warnings.push({ type: "alg_none" });
  }

  if (!isValidBase64Url(signaturePart)) {
    warnings.push({ type: "signature_malformed" });
  } else if (alg && alg.toLowerCase() !== "none") {
    warnings.push({ type: "signature_unverified" });
  }

  const exp = payloadJson.exp;
  if (typeof exp === "number" && Number.isFinite(exp)) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) {
      warnings.push({ type: "expired", exp });
    }
  }

  return warnings;
}

export function parseJwtToken(token: string): JwtParseResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }

  const parts = splitJwt(trimmed);
  if (!parts) {
    return { ok: false, error: "structure" };
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  let headerJson: Record<string, unknown>;
  let payloadJson: Record<string, unknown>;
  let header: JwtSection;
  let payload: JwtSection;

  try {
    jwtDecode(trimmed);
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      return { ok: false, error: "invalid" };
    }
  }

  try {
    const headerDecoded = decodeJsonSegment(headerPart);
    headerJson = headerDecoded.json;
    header = {
      raw: headerPart,
      formatted: headerDecoded.formatted,
      json: headerDecoded.json,
    };
  } catch {
    return { ok: false, error: "header" };
  }

  try {
    const payloadDecoded = decodeJsonSegment(payloadPart);
    payloadJson = payloadDecoded.json;
    payload = {
      raw: payloadPart,
      formatted: payloadDecoded.formatted,
      json: payloadDecoded.json,
    };
  } catch {
    return { ok: false, error: "payload" };
  }

  const warnings = collectWarnings(headerJson, payloadJson, signaturePart);
  const exp = typeof payloadJson.exp === "number" ? payloadJson.exp : undefined;

  return {
    ok: true,
    header,
    payload,
    signature: { raw: signaturePart },
    warnings,
    exp,
  };
}

export type ExpirationInfo = {
  hasExp: boolean;
  isExpired: boolean;
  expMs?: number;
  absolute?: string;
};

export function getExpirationInfo(exp: number | undefined, nowMs = Date.now()): ExpirationInfo {
  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return { hasExp: false, isExpired: false };
  }

  const expMs = exp * 1000;
  return {
    hasExp: true,
    isExpired: expMs <= nowMs,
    expMs,
    absolute: new Date(expMs).toLocaleString(),
  };
}

export function formatExpirationRelative(
  expMs: number,
  nowMs: number,
  locale: string,
  isExpired: boolean,
): string {
  const diffMs = expMs - nowMs;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);

  if (days >= 1) {
    return rtf.format(isExpired ? -days : days, "day");
  }
  if (hours >= 1) {
    return rtf.format(isExpired ? -hours : hours, "hour");
  }
  if (minutes >= 1) {
    return rtf.format(isExpired ? -minutes : minutes, "minute");
  }

  const seconds = Math.max(1, Math.round(absMs / 1000));
  return rtf.format(isExpired ? -seconds : seconds, "second");
}

export function hasSignatureIssue(warnings: JwtWarning[]): boolean {
  return warnings.some((warning) => warning.type === "signature_malformed" || warning.type === "alg_none");
}

export function isTokenExpired(warnings: JwtWarning[]): boolean {
  return warnings.some((warning) => warning.type === "expired");
}
