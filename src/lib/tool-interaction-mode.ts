import type { ToolDefinition } from "@/lib/types";

/**
 * Interaction mode for tool chrome (global site header vs tool-specific active header).
 *
 * - `upload` — clean phase until a file is present (dropzone tools)
 * - `interactive` — active tool chrome from mount (text/color/canvas generators)
 */
export type ToolInteractionMode = "upload" | "interactive";

type ToolInteractionRef = Pick<ToolDefinition, "slug" | "operation"> & {
  requiresUpload?: boolean;
};

/**
 * Curated fallback for tools that are interactive generators but do not yet
 * declare `requiresUpload: false` in tools.json. Prefer the JSON flag for new tools.
 */
const INTERACTIVE_GENERATOR_SLUGS = new Set<string>([
  "generate-favicon",
  "json-formatter",
  "json-minifier",
  "json-csv-explorer",
  "json-to-csv",
  "csv-to-json",
  "yaml-json-converter",
  "csv-to-markdown-table",
  "case-converter",
  "lorem-ipsum-generator",
  "reading-time-calculator",
  "quick-note",
  "string-generator",
  "word-character-counter",
  "text-diff",
  "text-diff-checker",
  "text-sanitizer",
  "text-workspace",
  "html-markdown-converter",
  "readability-analyzer",
  "base64-encoder-decoder",
  "url-encoder-decoder",
  "url-parameter-stripper",
  "qr-code-generator",
  "password-generator",
  "jwt-debugger",
  "user-agent-parser",
  "ssl-decoder",
  "my-ip",
  "color-converter",
  "base-converter",
  "timezone-converter",
  "global-timezone-converter",
  "storage-data-converter",
  "unit-converter",
  "sql-query-formatter",
  "hash-generator",
]);

/**
 * Resolve whether a tool is upload-gated or an interactive generator.
 * Explicit `requiresUpload` on the tool definition always wins.
 */
export function getToolInteractionMode(
  tool: ToolInteractionRef | null | undefined,
): ToolInteractionMode {
  if (!tool) return "upload";
  if (tool.requiresUpload === false) return "interactive";
  if (tool.requiresUpload === true) return "upload";
  if (INTERACTIVE_GENERATOR_SLUGS.has(tool.slug) || INTERACTIVE_GENERATOR_SLUGS.has(tool.operation)) {
    return "interactive";
  }
  return "upload";
}

/** True when the tool needs a file drop-zone before active tool chrome. */
export function toolRequiresUpload(tool: ToolInteractionRef | null | undefined): boolean {
  return getToolInteractionMode(tool) === "upload";
}

/** True for live text/picker/canvas creators — active header from mount. */
export function isInteractiveGeneratorTool(
  tool: ToolInteractionRef | null | undefined,
): boolean {
  return getToolInteractionMode(tool) === "interactive";
}

/** Initial workspace phase for modal / page shells. */
export function getInitialWorkspacePhase(
  tool: ToolInteractionRef | null | undefined,
): "clean" | "active" {
  return toolRequiresUpload(tool) ? "clean" : "active";
}
