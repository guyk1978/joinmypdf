"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DEMO_DATASET } from "@/lib/data-tool/demo";
import { parseFileText } from "@/lib/data-tool/parser";
import type { ParsedDataset } from "@/lib/data-tool/types";
import { matteDropzone, matteDropzoneActive, toolSecondaryBtn } from "@/lib/tool-ui";

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
  const t = useTranslations("DataTool");
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const readFile = useCallback(
    async (file: File) => {
      const format = detectFormat(file);
      if (!format) {
        onError(t("errorFormat"));
        return;
      }

      setBusy(true);
      try {
        const text = await file.text();
        const dataset = parseFileText(text, format, file.name);
        if (!dataset.rows.length) {
          onError(t("errorEmpty"));
          return;
        }
        onLoad(dataset);
      } catch (err) {
        const message = err instanceof Error ? err.message : t("errorParse");
        onError(message);
      } finally {
        setBusy(false);
      }
    },
    [onError, onLoad, t],
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
        aria-label={t("dropzoneAria")}
        className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-none px-2 py-6 text-center transition ${matteDropzone} ${drag ? matteDropzoneActive : "hover:border-neutral-400 dark:hover:border-neutral-600"}`}
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
          className="mb-3 text-neutral-700 dark:text-neutral-200"
          width="36"
          height="36"
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
        <p className="text-base font-semibold text-black dark:text-neutral-200">
          {busy ? t("dropTitleBusy") : t("dropTitle")}
        </p>
        <p className="mt-1 max-w-md text-sm text-black dark:text-neutral-200">{t("dropDescription")}</p>
        <p className="mt-2 text-xs text-black dark:text-neutral-200">{t("formatsHint")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className={toolSecondaryBtn}
          disabled={busy}
          onClick={() => onLoad({ ...DEMO_DATASET, rows: DEMO_DATASET.rows.map((r) => ({ ...r })) })}
        >
          {t("loadDemo")}
        </button>
      </div>
    </div>
  );
}
