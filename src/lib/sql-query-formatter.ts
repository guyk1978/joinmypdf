import { format, type KeywordCase } from "sql-formatter";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type SqlIndentOption = "2" | "4" | "tab";
export type SqlKeywordCaseOption = "upper" | "lower";

export type SqlFormatResult =
  | { ok: true; sql: string }
  | { ok: false; error: "empty" | "parse" };

export function formatSqlQuery(
  input: string,
  indent: SqlIndentOption,
  keywordCase: SqlKeywordCaseOption,
): SqlFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }

  try {
    const keywordCaseValue: KeywordCase = keywordCase === "upper" ? "upper" : "lower";
    const useTabs = indent === "tab";
    const tabWidth = indent === "4" ? 4 : 2;

    const sql = format(trimmed, {
      tabWidth,
      useTabs,
      keywordCase: keywordCaseValue,
      language: "sql",
    });

    return { ok: true, sql };
  } catch {
    return { ok: false, error: "parse" };
  }
}
