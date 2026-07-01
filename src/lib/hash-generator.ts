import CryptoJS from "crypto-js";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

export const HASH_ALGORITHMS: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

function arrayBufferToWordArray(buffer: ArrayBuffer): CryptoJS.lib.WordArray {
  const uint8 = new Uint8Array(buffer);
  const words: number[] = [];
  for (let i = 0; i < uint8.length; i += 1) {
    words[i >>> 2] |= uint8[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, uint8.length);
}

function hashWordArray(wordArray: CryptoJS.lib.WordArray, algorithm: HashAlgorithm): string {
  switch (algorithm) {
    case "MD5":
      return CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
    case "SHA-1":
      return CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
    case "SHA-256":
      return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    case "SHA-512":
      return CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
    default:
      return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  }
}

export function hashText(input: string, algorithm: HashAlgorithm): string {
  switch (algorithm) {
    case "MD5":
      return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex);
    case "SHA-1":
      return CryptoJS.SHA1(input).toString(CryptoJS.enc.Hex);
    case "SHA-256":
      return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
    case "SHA-512":
      return CryptoJS.SHA512(input).toString(CryptoJS.enc.Hex);
    default:
      return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
  }
}

export async function hashFile(file: File, algorithm: HashAlgorithm): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashWordArray(arrayBufferToWordArray(buffer), algorithm);
}
