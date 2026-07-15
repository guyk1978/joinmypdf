/** Pure base conversion (2 / 8 / 10 / 16) + optional bitwise ops on BigInt. */

export const NUMBER_BASES = [2, 8, 10, 16] as const;
export type NumberBase = (typeof NUMBER_BASES)[number];

export type BitwiseOp = "and" | "or" | "xor";

export const BITWISE_OPS: BitwiseOp[] = ["and", "or", "xor"];

const BASE_ALPHABET = "0123456789ABCDEF";

export function isValidDigitsForBase(value: string, base: NumberBase): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  let body = trimmed;
  if (body.startsWith("-") || body.startsWith("+")) {
    body = body.slice(1);
  }
  if (!body) return false;

  // Optional 0b / 0o / 0x prefixes when they match the selected base.
  const lower = body.toLowerCase();
  if (base === 2 && (lower.startsWith("0b") || lower.startsWith("0B"))) body = body.slice(2);
  if (base === 8 && (lower.startsWith("0o") || lower.startsWith("0O"))) body = body.slice(2);
  if (base === 16 && (lower.startsWith("0x") || lower.startsWith("0X"))) body = body.slice(2);
  if (!body) return false;

  const allowed = BASE_ALPHABET.slice(0, base);
  for (const ch of body) {
    if (ch === "_" || ch === " ") continue;
    if (!allowed.includes(ch.toUpperCase())) return false;
  }
  return true;
}

function normalizeInput(value: string, base: NumberBase): { sign: 1 | -1; digits: string } | null {
  const trimmed = value.trim().replace(/[\s_]/g, "");
  if (!trimmed) return null;

  let sign: 1 | -1 = 1;
  let body = trimmed;
  if (body.startsWith("-")) {
    sign = -1;
    body = body.slice(1);
  } else if (body.startsWith("+")) {
    body = body.slice(1);
  }
  if (!body) return null;

  const lower = body.toLowerCase();
  if (base === 2 && lower.startsWith("0b")) body = body.slice(2);
  if (base === 8 && lower.startsWith("0o")) body = body.slice(2);
  if (base === 16 && lower.startsWith("0x")) body = body.slice(2);
  if (!body) return null;

  if (!isValidDigitsForBase(sign === -1 ? `-${body}` : body, base)) return null;
  return { sign, digits: body.toUpperCase() };
}

export function parseBaseToBigInt(value: string, base: NumberBase): bigint | null {
  const normalized = normalizeInput(value, base);
  if (!normalized) return null;

  try {
    let result = 0n;
    const radix = BigInt(base);
    for (const ch of normalized.digits) {
      const digit = BigInt(BASE_ALPHABET.indexOf(ch));
      result = result * radix + digit;
    }
    return normalized.sign === -1 ? -result : result;
  } catch {
    return null;
  }
}

export function formatBigIntInBase(value: bigint, base: NumberBase): string {
  if (value === 0n) return "0";

  const negative = value < 0n;
  let n = negative ? -value : value;
  const radix = BigInt(base);
  let out = "";

  while (n > 0n) {
    const digit = Number(n % radix);
    out = BASE_ALPHABET[digit] + out;
    n /= radix;
  }

  return negative ? `-${out}` : out;
}

export type BaseConvertResult =
  | { ok: true; value: bigint; output: string }
  | { ok: false; error: "empty" | "invalid" };

export function convertBase(
  source: string,
  fromBase: NumberBase,
  toBase: NumberBase,
): BaseConvertResult {
  if (!source.trim()) return { ok: false, error: "empty" };
  if (!isValidDigitsForBase(source, fromBase)) return { ok: false, error: "invalid" };

  const value = parseBaseToBigInt(source, fromBase);
  if (value === null) return { ok: false, error: "invalid" };

  return { ok: true, value, output: formatBigIntInBase(value, toBase) };
}

export function applyBitwiseOp(a: bigint, b: bigint, op: BitwiseOp): bigint {
  switch (op) {
    case "and":
      return a & b;
    case "or":
      return a | b;
    case "xor":
      return a ^ b;
    default:
      return a;
  }
}

export type BitwiseConvertResult =
  | { ok: true; value: bigint; output: string; binary: string }
  | { ok: false; error: "empty" | "invalid" };

/** Bitwise ops interpreted on the absolute magnitude; result shown unsigned binary + selected to-base. */
export function convertWithBitwise(
  sourceA: string,
  sourceB: string,
  fromBase: NumberBase,
  toBase: NumberBase,
  op: BitwiseOp,
): BitwiseConvertResult {
  if (!sourceA.trim() || !sourceB.trim()) return { ok: false, error: "empty" };
  if (!isValidDigitsForBase(sourceA, fromBase) || !isValidDigitsForBase(sourceB, fromBase)) {
    return { ok: false, error: "invalid" };
  }

  const a = parseBaseToBigInt(sourceA, fromBase);
  const b = parseBaseToBigInt(sourceB, fromBase);
  if (a === null || b === null) return { ok: false, error: "invalid" };

  // Two's-complement style bitwise on signed BigInt is valid in JS; for calculator UX
  // we operate on magnitudes and re-apply a negative sign only if both inputs negative for AND.
  const result = applyBitwiseOp(a, b, op);
  const magnitude = result < 0n ? -result : result;

  return {
    ok: true,
    value: result,
    output: formatBigIntInBase(result, toBase),
    binary: formatBigIntInBase(magnitude, 2),
  };
}

export function getBaseLabelKey(base: NumberBase): "binary" | "octal" | "decimal" | "hexadecimal" {
  switch (base) {
    case 2:
      return "binary";
    case 8:
      return "octal";
    case 10:
      return "decimal";
    case 16:
      return "hexadecimal";
  }
}
