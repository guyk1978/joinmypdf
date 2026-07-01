import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*()-_=+[]{};:,.<>?";

export const STRING_GENERATOR_MIN_LENGTH = 1;
export const STRING_GENERATOR_MAX_LENGTH = 4096;
export const STRING_GENERATOR_MIN_QUANTITY = 1;
export const STRING_GENERATOR_MAX_QUANTITY = 100;

export type RandomStringOptions = {
  length: number;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSpecial: boolean;
  quantity: number;
};

export type StringGeneratorResult =
  | { ok: true; values: string[] }
  | { ok: false; error: string };

function buildCharset(options: Pick<
  RandomStringOptions,
  "includeUppercase" | "includeNumbers" | "includeSpecial"
>): string {
  let charset = LOWERCASE;
  if (options.includeUppercase) charset += UPPERCASE;
  if (options.includeNumbers) charset += NUMBERS;
  if (options.includeSpecial) charset += SPECIAL;
  return charset;
}

function clampQuantity(quantity: number): number {
  return Math.min(
    STRING_GENERATOR_MAX_QUANTITY,
    Math.max(STRING_GENERATOR_MIN_QUANTITY, Math.floor(quantity) || 1),
  );
}

function clampLength(length: number): number {
  return Math.min(
    STRING_GENERATOR_MAX_LENGTH,
    Math.max(STRING_GENERATOR_MIN_LENGTH, Math.floor(length) || 1),
  );
}

export function generateRandomString(length: number, charset: string): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  return result;
}

export function generateRandomStrings(options: RandomStringOptions): StringGeneratorResult {
  const length = clampLength(options.length);
  const quantity = clampQuantity(options.quantity);
  const charset = buildCharset(options);

  if (!charset) {
    return { ok: false, error: "Enable at least one character set besides lowercase letters." };
  }

  const values = Array.from({ length: quantity }, () => generateRandomString(length, charset));
  return { ok: true, values };
}

export function generateUuidV4Batch(quantity: number): StringGeneratorResult {
  if (typeof crypto.randomUUID !== "function") {
    return { ok: false, error: "UUID generation is not supported in this browser." };
  }

  const count = clampQuantity(quantity);
  const values = Array.from({ length: count }, () => crypto.randomUUID());
  return { ok: true, values };
}

export function formatGeneratedOutput(values: string[]): string {
  return values.join("\n");
}
