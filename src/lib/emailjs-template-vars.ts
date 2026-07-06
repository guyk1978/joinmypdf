/** Shared EmailJS template fields captured at send time in the browser. */
export function buildEmailJsTemplateContext(pageUrl: string, pageTitle: string) {
  const timestampIso = new Date().toISOString();
  const date =
    typeof window !== "undefined" ? new Date().toLocaleString() : timestampIso;
  const url =
    typeof window !== "undefined" && window.location?.href
      ? window.location.href
      : pageUrl;
  const tool_name = pageTitle || pageUrl;

  return { timestampIso, date, url, tool_name };
}
