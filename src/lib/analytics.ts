export const EVENTS = {
  page_view: "page_view",
  tool_view: "tool_view",
  file_selected: "file_selected",
  tool_run_start: "tool_run_start",
  tool_run_success: "tool_run_success",
  tool_run_error: "tool_run_error",
  download_click: "download_click",
  cta_primary_click: "cta_primary_click",
  cta_secondary_click: "cta_secondary_click",
  home_drop_files: "home_drop_files",
  upsell_click: "upsell_click",
  share_click: "share_click",
  scroll_depth: "scroll_depth",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export type EventProps = Record<string, string | number | boolean | undefined | null>;

export function sanitizeProps(props?: EventProps) {
  if (!props) return undefined;
  const o: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") o[k] = v;
  }
  return o;
}
