"use client";

import { downloadTextFile, rowsToCsv, rowsToJson, rowsToXml } from "@/lib/data-tool/converter";
import type { DataRow } from "@/lib/data-tool/types";

type ExportPanelProps = {
  rows: DataRow[];
  columns: string[];
  baseName?: string;
};

function baseFileName(name?: string): string {
  const raw = (name ?? "joinmypdf-data").replace(/\.[^.]+$/, "");
  const slug = raw.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "joinmypdf-data";
  return `joinmypdf-${slug}`;
}

export function ExportPanel({ rows, columns, baseName }: ExportPanelProps) {
  const stem = baseFileName(baseName);
  const disabled = rows.length === 0;

  return (
    <section className="rounded-none border border-white/10 bg-white/[0.02] p-3 md:p-4">
      <h3 className="text-lg font-semibold text-ink">Export</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Download converted data instantly—files are generated in your browser.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-surface transition hover:bg-neutral-200 dark:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() =>
            downloadTextFile(rowsToCsv(rows, columns), `${stem}.csv`, "text/csv;charset=utf-8")
          }
        >
          Download CSV
        </button>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-none border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-neutral-300 dark:border-neutral-800 hover:text-black dark:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() =>
            downloadTextFile(
              rowsToJson(rows, true),
              `${stem}.json`,
              "application/json;charset=utf-8",
            )
          }
        >
          Download JSON
        </button>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-none border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-neutral-300 dark:border-neutral-800 hover:text-black dark:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() =>
            downloadTextFile(
              rowsToXml(rows, columns),
              `${stem}.xml`,
              "application/xml;charset=utf-8",
            )
          }
        >
          Download XML
        </button>
      </div>
    </section>
  );
}
