import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `json-csv-explorer` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Raw API dumps and exported spreadsheets are hard to scan in a text editor. An online JSON viewer and CSV data explorer let you beautify structure, search nested fields, and export only the columns you need — without uploading sensitive datasets to a remote workspace.",
  faq: [{"question":"Is the data processed locally?","answer":"Yes. Parsing, search, filtering, and export run entirely in your browser. Nothing is uploaded."},{"question":"Does this support large files?","answer":"Yes, within your device memory. The explorer uses virtualized lists so the UI stays responsive while scanning large trees and tables."},{"question":"How do I filter nested data?","answer":"Use live search to highlight matching keys/values (nested branches expand automatically). Use the column picker to keep only selected object keys or CSV columns before Extract & Download."},{"question":"What does Copy Path do?","answer":"Click a JSON key to copy its full path (for example user.profile.settings.theme) to your clipboard for use in code."},{"question":"Can I sort CSV columns?","answer":"Yes. Click a column header in the table view to sort ascending or descending, optionally after filtering with search."},{"question":"Is the JSON/CSV Explorer free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
