/**
 * Local-only activity tracking for the personalized homepage sections:
 * per-tool usage counts (Quick Actions), the last tools visited
 * (Recent Tools), and the last files a user loaded into a tool
 * (Recent Workspaces). Everything stays in localStorage — nothing
 * leaves the device.
 */

export const TOOL_USAGE_STORAGE_KEY = "joinmypdf_tool_usage";
export const RECENT_TOOLS_STORAGE_KEY = "joinmypdf_recent_tools";
export const RECENT_WORKSPACES_STORAGE_KEY = "joinmypdf_recent_workspaces";
export const RECENT_ACTIVITY_CHANGED_EVENT = "joinmypdf:recent-activity-changed";

export type RecentWorkspaceEntry = {
  toolId: string;
  fileName: string;
  /** Epoch ms of the last time this file/tool pair was touched. */
  at: number;
};

export const MAX_RECENT_TOOLS = 20;
export const MAX_RECENT_WORKSPACES = 20;

function emitChange(): void {
  window.dispatchEvent(new Event(RECENT_ACTIVITY_CHANGED_EVENT));
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emitChange();
  } catch {
    // Storage full or unavailable — personalization silently degrades.
  }
}

/* ------------------------------ usage counts ------------------------------ */

export function readToolUsageCounts(): Record<string, number> {
  const parsed = readJson<Record<string, unknown>>(TOOL_USAGE_STORAGE_KEY);
  if (!parsed || typeof parsed !== "object") return {};
  const counts: Record<string, number> = {};
  for (const [toolId, value] of Object.entries(parsed)) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      counts[toolId] = Math.floor(value);
    }
  }
  return counts;
}

export function recordToolUsage(toolId: string): void {
  if (typeof window === "undefined" || !toolId) return;
  const counts = readToolUsageCounts();
  counts[toolId] = (counts[toolId] ?? 0) + 1;
  writeJson(TOOL_USAGE_STORAGE_KEY, counts);
  // Keep the chronological "Recent Tools" list in sync with every visit.
  recordRecentTool(toolId);
}

/** Tool ids ranked by personal usage, most used first. */
export function readTopUsedToolIds(limit: number): string[] {
  return Object.entries(readToolUsageCounts())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([toolId]) => toolId);
}

/* ------------------------------ recent tools ------------------------------ */

function sanitizeRecentToolIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

/** Most recently visited tool ids, newest first (max HOME / recent cap). */
export function readRecentToolIds(): string[] {
  return sanitizeRecentToolIds(readJson(RECENT_TOOLS_STORAGE_KEY)).slice(
    0,
    MAX_RECENT_TOOLS,
  );
}

/**
 * Pushes a tool to the front of the recent list (deduped, capped).
 * Safe to call from tool pages and the tool modal.
 */
export function recordRecentTool(toolId: string): void {
  if (typeof window === "undefined" || !toolId) return;
  const next = [
    toolId,
    ...readRecentToolIds().filter((id) => id !== toolId),
  ].slice(0, MAX_RECENT_TOOLS);
  writeJson(RECENT_TOOLS_STORAGE_KEY, next);
}

/* ---------------------------- recent workspaces --------------------------- */

function sanitizeRecentEntries(value: unknown): RecentWorkspaceEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: RecentWorkspaceEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { toolId, fileName, at } = item as Record<string, unknown>;
    if (typeof toolId !== "string" || !toolId) continue;
    if (typeof fileName !== "string" || !fileName) continue;
    if (typeof at !== "number" || !Number.isFinite(at)) continue;
    entries.push({ toolId, fileName, at });
  }
  return entries;
}

export function readRecentWorkspaces(): RecentWorkspaceEntry[] {
  return sanitizeRecentEntries(readJson(RECENT_WORKSPACES_STORAGE_KEY));
}

export function recordRecentWorkspace(toolId: string, fileName: string): void {
  if (typeof window === "undefined" || !toolId || !fileName) return;
  const now = Date.now();
  const next = [
    { toolId, fileName, at: now },
    ...readRecentWorkspaces().filter(
      (entry) => !(entry.toolId === toolId && entry.fileName === fileName),
    ),
  ].slice(0, MAX_RECENT_WORKSPACES);
  writeJson(RECENT_WORKSPACES_STORAGE_KEY, next);
}
