"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  createNUpPdf,
  nUpOutputSheetCount,
  nUpPdfOutputName,
  resolveNUpGrid,
  type NUpPreset,
  type NUpProgress,
} from "@/lib/pdf-n-up";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const PRESETS: NUpPreset[] = ["2-up", "4-up", "6-up", "9-up", "custom"];

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(progress: NUpProgress | null, busy: boolean): number {
  if (!progress || progress.totalSheets <= 0) {
    return busy ? 10 : 0;
  }

  const phaseWeight =
    progress.phase === "loading" ? 0.1 : progress.phase === "arranging" ? 0.85 : 1;
  const sheetRatio = progress.currentSheet / progress.totalSheets;
  return Math.min(100, Math.round((phaseWeight * 0.25 + sheetRatio * 0.75) * 100));
}

export function NUpPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: NUpProgress | null) => {
    if (!p) return "";
    if (p.phase === "arranging" && p.totalSheets > 0) {
      return ws.wsProgress("arranging", { current: p.currentSheet, total: p.totalSheets });
    }
    return progressLabelFromPhase(tool.operation, p, ws);
  };
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [preset, setPreset] = useState<NUpPreset>("4-up");
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<NUpProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const grid = useMemo(
    () => resolveNUpGrid({ preset, customCols, customRows }),
    [preset, customCols, customRows],
  );
  const outputSheets = useMemo(
    () => (pageCount > 0 ? nUpOutputSheetCount(pageCount, grid) : 0),
    [pageCount, grid],
  );

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setPassword("");
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }

    setFile(next);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsCommon("readingPdf"));

    try {
      const pdfjs = await import("pdfjs-dist");
      const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      const url = URL.createObjectURL(next);
      try {
        const doc = await pdfjs.getDocument({ url }).promise;
        setPageCount(doc.numPages);
      } finally {
        URL.revokeObjectURL(url);
      }

      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
    }
  };

  const onConvert = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setProgress({ phase: "loading", currentSheet: 0, totalSheets: outputSheets });
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, preset });

    try {
      const bytes = await createNUpPdf(
        file,
        { preset, customCols, customRows, password: password.trim() || undefined },
        (p) => {
          setProgress(p);
          setStatus(labelProgress(p));
        },
      );
      const outName = nUpPdfOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName, sheets: outputSheets }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, preset });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
      }, 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      capture(EVENTS.tool_run_error, {
        operation: tool.operation,
        slug,
        message: parsed.message,
        kind: parsed.kind,
      });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={showWorkspace}>
        {!showWorkspace ? (
          <FileUploadZone
            operation={tool.operation}
            drag={drag}
            role="button"
            tabIndex={0}
            aria-controls={`${baseId}-input`}
            className="cursor-pointer"
            title={ws.uploadTitle()}
            description={ws.uploadDescription()}
            onKeyDown={(e: ReactKeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const picked = e.dataTransfer.files?.[0];
              if (picked) void pickFile(picked);
            }}
            onClick={() => inputRef.current?.click()}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                className="sr-only"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) void pickFile(picked);
                  e.target.value = "";
                }}
              />
            }
          />
        ) : null}
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {file ? pdf.formatBytes(file.size) : ""}
                {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : ""}
                {outputSheets
                  ? ` · ${ws.wsUi("outputSheets", { count: outputSheets })}`
                  : ""}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <fieldset className="space-y-2 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {ws.wsUi("layoutLegend")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((value) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-neutral-800 bg-black px-3 py-2 text-sm text-neutral-200"
                >
                  <input
                    type="radio"
                    name={`${baseId}-layout`}
                    value={value}
                    checked={preset === value}
                    disabled={busy}
                    onChange={() => setPreset(value)}
                    className="accent-white"
                  />
                  <span>{ws.wsUi(`preset_${value.replace("-", "_")}`)}</span>
                </label>
              ))}
            </div>
            {preset === "custom" ? (
              <div className="flex flex-wrap items-end gap-3 max-w-md">
                <div className="protect-form__fields min-w-[7rem]">
                  <label className="protect-form__label" htmlFor={`${baseId}-cols`}>
                    {ws.wsUi("customCols")}
                  </label>
                  <select
                    id={`${baseId}-cols`}
                    value={customCols}
                    disabled={busy}
                    onChange={(e) => setCustomCols(Number(e.target.value))}
                    className="protect-form__input"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="protect-form__fields min-w-[7rem]">
                  <label className="protect-form__label" htmlFor={`${baseId}-rows`}>
                    {ws.wsUi("customRows")}
                  </label>
                  <select
                    id={`${baseId}-rows`}
                    value={customRows}
                    disabled={busy}
                    onChange={(e) => setCustomRows(Number(e.target.value))}
                    className="protect-form__input"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-ink-muted pb-2">
                  {ws.wsUi("customGridHint", { cols: grid.cols, rows: grid.rows })}
                </p>
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-ink-muted">{ws.wsUi("layoutHint")}</p>
          </fieldset>

          <div className="protect-form__fields max-w-md">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              {ws.wsUi("passwordLabel")}{" "}
              <span className="font-normal text-black dark:text-neutral-200">{ws.wsUi("passwordHint")}</span>
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="protect-form__input"
              placeholder={ws.wsUi("passwordPlaceholder")}
              disabled={busy}
            />
          </div>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className={toolPrimaryBtn}
            >
              {done ? ws.wsText("convertAgainLabel") : ws.wsText("convertLabel")}
            </button>
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>
        </div>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? ws.wsText("adjustPassword") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("convertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
