import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type InventoryToolStatus = "active" | "inactive";

type InventoryStatusFile = {
  updatedAt: string;
  tools: Record<string, InventoryToolStatus>;
};

const STATUS_DIR = path.join(process.cwd(), "logs");
const STATUS_PATH = path.join(STATUS_DIR, "inventory-tool-status.json");

function emptyStore(): InventoryStatusFile {
  return { updatedAt: new Date().toISOString(), tools: {} };
}

export function readInventoryStatusMap(): Record<string, InventoryToolStatus> {
  try {
    if (!existsSync(STATUS_PATH)) return {};
    const raw = readFileSync(STATUS_PATH, "utf8");
    const parsed = JSON.parse(raw) as InventoryStatusFile;
    if (!parsed || typeof parsed !== "object" || !parsed.tools) return {};
    return parsed.tools;
  } catch {
    return {};
  }
}

export function getInventoryToolStatus(slug: string): InventoryToolStatus {
  return readInventoryStatusMap()[slug] ?? "active";
}

export function setInventoryToolStatus(
  slug: string,
  status: InventoryToolStatus,
): InventoryStatusFile {
  const tools = { ...readInventoryStatusMap(), [slug]: status };
  const next: InventoryStatusFile = {
    updatedAt: new Date().toISOString(),
    tools,
  };
  if (!existsSync(STATUS_DIR)) mkdirSync(STATUS_DIR, { recursive: true });
  writeFileSync(STATUS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function isSitemapIndexableStatus(status: InventoryToolStatus | undefined): boolean {
  return (status ?? "active") === "active";
}

export { emptyStore as emptyInventoryStatusStore };
