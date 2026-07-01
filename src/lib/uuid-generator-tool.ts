import { v1 as uuidV1, v4 as uuidV4, v7 as uuidV7 } from "uuid";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type UuidVersion = "v1" | "v4" | "v7";

export const UUID_VERSIONS: UuidVersion[] = ["v4", "v1", "v7"];

export const UUID_BULK_COUNTS = [1, 5, 10, 20] as const;

export type UuidBulkCount = (typeof UUID_BULK_COUNTS)[number];

export type UuidGenerateResult =
  | { ok: true; values: string[] }
  | { ok: false; error: "unsupported" };

export function generateUuid(version: UuidVersion): string {
  switch (version) {
    case "v1":
      return uuidV1();
    case "v4":
      return uuidV4();
    case "v7":
      return uuidV7();
    default:
      return uuidV4();
  }
}

export function generateUuidBatch(version: UuidVersion, count: number): UuidGenerateResult {
  const quantity = Math.min(20, Math.max(1, Math.floor(count) || 1));

  try {
    const values = Array.from({ length: quantity }, () => generateUuid(version));
    return { ok: true, values };
  } catch {
    return { ok: false, error: "unsupported" };
  }
}

export function formatUuidOutput(values: string[]): string {
  return values.join("\n");
}
