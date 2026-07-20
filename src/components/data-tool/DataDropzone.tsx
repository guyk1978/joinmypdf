"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatSupportsLabel,
  IndustrialMatteDropzone,
} from "@/components/IndustrialMatteDropzone";
import { DEMO_DATASET } from "@/lib/data-tool/demo";
import { parseFileText } from "@/lib/data-tool/parser";
import type { ParsedDataset } from "@/lib/data-tool/types";
import { toolSecondaryBtn } from "@/lib/tool-ui";

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
  const common = useTranslations("Workspace.common");
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
      <IndustrialMatteDropzone
        role="region"
        aria-label={t("dropzoneAria")}
        active={drag}
        disabled={busy}
        dropTitle={busy ? t("dropTitleBusy") : t("dropTitle")}
        selectLabel={t.has("selectLabel") ? t("selectLabel") : "Select file from device"}
        supportsLabel={
          t.has("formatsHint") && /^supports:/i.test(t("formatsHint"))
            ? t("formatsHint")
            : formatSupportsLabel(["CSV", "JSON"])
        }
        privacyLabel={
          common.has("localProcessingNothingUploaded")
            ? common("localProcessingNothingUploaded")
            : t.has("privacyBadge")
              ? t("privacyBadge")
              : "Local Processing. Nothing is uploaded."
        }
        tabIndex={0}
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
        input={
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
        }
      />

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
