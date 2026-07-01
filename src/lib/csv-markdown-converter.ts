import { parseCsvString } from "@/lib/data-tool/parser";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type CsvMarkdownConvertResult =
  | { ok: true; markdown: string; rowCount: number }
  | { ok: false; error: "empty" | "parse" };

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

export function convertCsvToMarkdownTable(input: string): CsvMarkdownConvertResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }

  try {
    const dataset = parseCsvString(trimmed);
    if (!dataset.columns.length) {
      return { ok: false, error: "parse" };
    }

    const headers = dataset.columns.map(escapeMarkdownCell);
    const headerRow = `| ${headers.join(" | ")} |`;
    const separator = `| ${headers.map(() => "---").join(" | ")} |`;
    const bodyRows = dataset.rows.map((row) => {
      const cells = dataset.columns.map((column) => escapeMarkdownCell(row[column] ?? ""));
      return `| ${cells.join(" | ")} |`;
    });

    return {
      ok: true,
      markdown: [headerRow, separator, ...bodyRows].join("\n"),
      rowCount: dataset.rows.length,
    };
  } catch {
    return { ok: false, error: "parse" };
  }
}
