"use client";

import { useCallback, useRef, useState } from "react";
import { DEMO_DATASET } from "@/lib/data-tool/demo";
import { parseFileText } from "@/lib/data-tool/parser";
import type { ParsedDataset } from "@/lib/data-tool/types";

type DataDropzoneProps = {
  onLoad: (dataset: ParsedDataset) => void;
  onError: (message: string) => void;
};

function detectFormat(file: File): "csv" | "json" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".json")) return "json";
  if (file.type === "text/csv" || file.type === "application/vnd.ms-excel") return "csv";
  if (file.type === "application/json") return "json";
  return null;
}

export function DataDropzone({ onLoad, onError }: DataDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const readFile = useCallback(
    async (file: File) => {
      const format = detectFormat(file);
      if (!format) {
        onError("Please upload a .csv or .json file.");
        return;
      }

      setBusy(true);
      try {
        const text = await file.text();
        const dataset = parseFileText(text, format, file.name);
        if (!dataset.rows.length) {
          onError("No rows found in that file. Check the format and try again.");
          return;
        }
        onLoad(dataset);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not parse that file.";
        onError(message);
      } finally {
        setBusy(false);
      }
    },
    [onError, onLoad],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;
      void readFile(file);
    },
    [readFile],
  );

  return (
    <div className="space-y-2">
      <div
        role="region"
        aria-label="Upload CSV or JSON"
        className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-none border-2 border-dashed px-4 py-10 text-center transition ${ drag ? "border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800" : "border-white/15 bg-white/[0.02] hover:border-neutral-300 dark:border-neutral-800 hover:bg-white/[0.04]" }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <svg
          className="mb-4 text-black dark:text-neutral-200"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 16V4m0 0l-4 4m4-4 4 4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-lg font-semibold text-ink">
          {busy ? "Reading file…" : "Drop CSV or JSON here"}
        </p>
        <p className="mt-2 max-w-md text-sm text-ink-muted">
          Drag and drop, or click to browse. Parsed entirely in your browser—nothing is uploaded.
        </p>
        <p className="mt-3 text-xs text-ink-muted">Supports .csv and .json</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-none border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-neutral-300 dark:border-neutral-800 hover:text-black dark:text-neutral-200"
          disabled={busy}
          onClick={() => onLoad({ ...DEMO_DATASET, rows: DEMO_DATASET.rows.map((r) => ({ ...r })) })}
        >
          Load demo data
        </button>
      </div>
    </div>
  );
}
