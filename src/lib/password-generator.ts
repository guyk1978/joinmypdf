import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export type PasswordGeneratorOptions = {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
};

export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  score: number;
  percent: number;
};

export type PasswordGenerateResult =
  | { ok: true; password: string; strength: PasswordStrength }
  | { ok: false; error: "charset" };

function clampLength(length: number): number {
  return Math.min(PASSWORD_MAX_LENGTH, Math.max(PASSWORD_MIN_LENGTH, Math.floor(length) || PASSWORD_MIN_LENGTH));
}

function buildCharset(options: PasswordGeneratorOptions): string {
  let charset = "";
  if (options.includeLowercase) charset += LOWERCASE;
  if (options.includeUppercase) charset += UPPERCASE;
  if (options.includeNumbers) charset += NUMBERS;
  if (options.includeSymbols) charset += SYMBOLS;
  return charset;
}

function pickRandomChar(charset: string): string {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return charset[bytes[0] % charset.length];
}

function shuffleString(value: string): string {
  const chars = value.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const bytes = new Uint8Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function ensureRequiredChars(options: PasswordGeneratorOptions): string[] {
  const required: string[] = [];
  if (options.includeLowercase) required.push(pickRandomChar(LOWERCASE));
  if (options.includeUppercase) required.push(pickRandomChar(UPPERCASE));
  if (options.includeNumbers) required.push(pickRandomChar(NUMBERS));
  if (options.includeSymbols) required.push(pickRandomChar(SYMBOLS));
  return required;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const percent = Math.min(100, Math.round((score / 7) * 100));

  let level: PasswordStrengthLevel = "weak";
  if (score >= 6) level = "strong";
  else if (score >= 5) level = "good";
  else if (score >= 3) level = "fair";

  return { level, score, percent };
}

export function generatePassword(options: PasswordGeneratorOptions): PasswordGenerateResult {
  const length = clampLength(options.length);
  const charset = buildCharset(options);

  if (!charset) {
    return { ok: false, error: "charset" };
  }

  const required = ensureRequiredChars(options);
  const remaining = Math.max(0, length - required.length);
  let password = required.join("");

  for (let i = 0; i < remaining; i += 1) {
    password += pickRandomChar(charset);
  }

  password = shuffleString(password);
  return {
    ok: true,
    password,
    strength: evaluatePasswordStrength(password),
  };
}
