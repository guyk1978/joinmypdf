"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { fillEmptyCells, removeDuplicates, trimWhitespace } from "@/lib/data-tool/cleanHelpers";
import type { ParsedDataset, SortState } from "@/lib/data-tool/types";
import { DataDropzone } from "@/components/data-tool/DataDropzone";
import { DataGridTable } from "@/components/data-tool/DataGridTable";
import { ExportPanel } from "@/components/data-tool/ExportPanel";
import { matteWorkspaceSection, toolSecondaryBtn } from "@/lib/tool-ui";

export function DataToolDashboard() {
  const t = useTranslations("DataTool");
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [status, setStatus] = useState("");

  const columns = dataset?.columns ?? [];
  const rows = dataset?.rows ?? [];

  const handleLoad = useCallback(
    (next: ParsedDataset) => {
      setDataset(next);
      setSort(null);
      setStatus(
        t("loadedRows", {
          count: next.rows.length.toLocaleString(),
          file: next.fileName ?? next.sourceFormat,
        }),
      );
    },
    [t],
  );

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
          ? t("dedupeDone", { count: nextRows.length.toLocaleString() })
          : action === "trim"
            ? t("trimDone")
            : t("fillDone"),
      );
    },
    [columns, dataset, t],
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
    return dataset.sourceFormat === "demo" ? t("demoDataset") : dataset.sourceFormat.toUpperCase();
  }, [dataset, t]);

  const toolbarBtn =
    "rounded-none border border-neutral-300 px-2 py-1 text-xs font-medium text-black transition hover:border-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-200";

  return (
    <div className="data-tool-workspace space-y-2">
      {status ? (
        <p className="text-sm text-ink-muted" aria-live="polite">
          {status}
        </p>
      ) : null}

      {!dataset ? (
        <DataDropzone onLoad={handleLoad} onError={handleError} />
      ) : (
        <div className="space-y-2">
          <div className={`flex flex-wrap items-center justify-between gap-2 ${matteWorkspaceSection}`}>
            <div>
              <p className="text-sm font-medium text-black dark:text-neutral-200">{sourceLabel}</p>
              <p className="font-mono text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
                {t("gridMeta", {
                  rows: rows.length.toLocaleString(),
                  cols: columns.length,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={toolbarBtn} onClick={() => applyClean("trim")}>
                {t("trimWhitespace")}
              </button>
              <button type="button" className={toolbarBtn} onClick={() => applyClean("fill")}>
                {t("fillEmpty")}
              </button>
              <button type="button" className={toolbarBtn} onClick={() => applyClean("dedupe")}>
                {t("removeDuplicates")}
              </button>
              <button
                type="button"
                className={toolSecondaryBtn}
                onClick={() => {
                  setDataset(null);
                  setSort(null);
                  setStatus(t("clearedWorkspace"));
                }}
              >
                {t("clearData")}
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
