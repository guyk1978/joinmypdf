"use client";

import { useCallback, useMemo, useState } from "react";
import { fillEmptyCells, removeDuplicates, trimWhitespace } from "@/lib/data-tool/cleanHelpers";
import type { ParsedDataset, SortState } from "@/lib/data-tool/types";
import { DataDropzone } from "@/components/data-tool/DataDropzone";
import { DataGridTable } from "@/components/data-tool/DataGridTable";
import { ExportPanel } from "@/components/data-tool/ExportPanel";

export function DataToolDashboard() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [status, setStatus] = useState("");

  const columns = dataset?.columns ?? [];
  const rows = dataset?.rows ?? [];

  const handleLoad = useCallback((next: ParsedDataset) => {
    setDataset(next);
    setSort(null);
    setStatus(
      `Loaded ${next.rows.length.toLocaleString()} rows from ${next.fileName ?? next.sourceFormat}.`,
    );
  }, []);

  const handleError = useCallback((message: string) => {
    setStatus(message);
  }, []);

  const applyClean = useCallback(
    (action: "dedupe" | "trim" | "fill") => {
      if (!dataset) return;
      let nextRows = dataset.rows;

      if (action === "dedupe") nextRows = removeDuplicates(nextRows, columns);
      if (action === "trim") nextRows = trimWhitespace(nextRows, columns);
      if (action === "fill") nextRows = fillEmptyCells(nextRows, columns);

      setDataset({ ...dataset, rows: nextRows });
      setStatus(
        action === "dedupe"
          ? `Removed duplicates — ${nextRows.length.toLocaleString()} rows remaining.`
          : action === "trim"
            ? "Trimmed whitespace on all cells."
            : "Filled empty cells with —.",
      );
    },
    [columns, dataset],
  );

  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return null;
    });
  }, []);

  const sourceLabel = useMemo(() => {
    if (!dataset) return "";
    if (dataset.fileName) return dataset.fileName;
    return dataset.sourceFormat === "demo" ? "Demo dataset" : dataset.sourceFormat.toUpperCase();
  }, [dataset]);

  return (
    <div className="data-tool-workspace space-y-4">
      {status ? (
        <p className="text-sm text-ink-muted" aria-live="polite">
          {status}
        </p>
      ) : null}

      {!dataset ? (
        <DataDropzone onLoad={handleLoad} onError={handleError} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-800 bg-neutral-900 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-neutral-200">{sourceLabel}</p>
              <p className="font-mono text-xs tabular-nums text-neutral-400">
                {rows.length.toLocaleString()} rows · {columns.length} columns · client-side only
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="border border-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                onClick={() => applyClean("trim")}
              >
                Trim whitespace
              </button>
              <button
                type="button"
                className="border border-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                onClick={() => applyClean("fill")}
              >
                Fill empty cells
              </button>
              <button
                type="button"
                className="border border-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                onClick={() => applyClean("dedupe")}
              >
                Remove duplicates
              </button>
              <button
                type="button"
                className="border border-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-black dark:text-neutral-200"
                onClick={() => {
                  setDataset(null);
                  setSort(null);
                  setStatus("Cleared workspace. Upload a new file or load demo data.");
                }}
              >
                Clear data
              </button>
            </div>
          </div>

          <DataGridTable rows={rows} columns={columns} sort={sort} onSort={handleSort} />
          <ExportPanel rows={rows} columns={columns} baseName={dataset.fileName} />
        </div>
      )}
    </div>
  );
}
