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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 md:px-5">
            <div>
              <p className="text-sm font-medium text-ink">{sourceLabel}</p>
              <p className="text-xs text-ink-muted">
                {rows.length.toLocaleString()} rows · {columns.length} columns · client-side only
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand/35 hover:text-brand"
                onClick={() => applyClean("trim")}
              >
                Trim whitespace
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand/35 hover:text-brand"
                onClick={() => applyClean("fill")}
              >
                Fill empty cells
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand/35 hover:text-brand"
                onClick={() => applyClean("dedupe")}
              >
                Remove duplicates
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-red-400/40 hover:text-red-300"
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
