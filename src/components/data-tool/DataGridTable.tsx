"use client";

import { useMemo } from "react";
import type { DataRow, SortDirection, SortState } from "@/lib/data-tool/types";

type DataGridTableProps = {
  rows: DataRow[];
  columns: string[];
  sort: SortState;
  onSort: (column: string) => void;
};

function compareValues(a: string, b: string, direction: SortDirection): number {
  const na = Number(a);
  const nb = Number(b);
  const bothNumeric = a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb);
  const cmp = bothNumeric ? na - nb : a.localeCompare(b, undefined, { sensitivity: "base" });
  return direction === "asc" ? cmp : -cmp;
}

export function DataGridTable({ rows, columns, sort, onSort }: DataGridTableProps) {
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) =>
      compareValues(a[sort.column] ?? "", b[sort.column] ?? "", sort.direction),
    );
  }, [rows, sort]);

  const displayColumns = columns.length
    ? columns
    : rows.length
      ? Object.keys(rows[0])
      : [];

  if (!displayColumns.length) {
    return (
      <p className="rounded-none border border-white/10 bg-white/[0.02] px-4 py-4 text-center text-sm text-ink-muted">
        No columns to display.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-none border border-white/10 bg-neutral-200 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-sm font-medium text-ink">
          <span className="text-black dark:text-neutral-200">{sortedRows.length.toLocaleString()}</span> rows
          <span className="mx-2 text-ink-muted">·</span>
          <span className="text-black dark:text-neutral-200">{displayColumns.length}</span> columns
        </p>
        {sort ? (
          <p className="text-xs text-ink-muted">
            Sorted by <span className="font-medium text-ink">{sort.column}</span> (
            {sort.direction})
          </p>
        ) : (
          <p className="text-xs text-ink-muted">Click a header to sort</p>
        )}
      </div>

      <div className="max-h-[min(52vh,520px)] overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-200 dark:bg-neutral-900 backdrop-blur-sm">
            <tr>
              <th
                scope="col"
                className="w-12 border-b border-white/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-neutral-200"
              >
                #
              </th>
              {displayColumns.map((col) => {
                const active = sort?.column === col;
                const arrow = active ? (sort.direction === "asc" ? " ↑" : " ↓") : "";
                return (
                  <th
                    key={col}
                    scope="col"
                    className="border-b border-white/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-neutral-200"
                  >
                    <button
                      type="button"
                      className={`inline-flex max-w-full items-center gap-1 truncate transition hover:text-black dark:text-neutral-200 ${ active ? "text-black dark:text-neutral-200" : "" }`}
                      onClick={() => onSort(col)}
                    >
                      {col}
                      <span aria-hidden="true">{arrow}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr
                key={`${index}-${row[displayColumns[0]] ?? ""}`}
                className="border-b border-white/[0.06] transition hover:bg-white/[0.03]"
              >
                <td className="px-3 py-2 text-xs tabular-nums text-black dark:text-neutral-200">{index + 1}</td>
                {displayColumns.map((col) => (
                  <td key={col} className="max-w-[240px] truncate px-3 py-2 text-black dark:text-neutral-200" title={row[col]}>
                    {row[col] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
