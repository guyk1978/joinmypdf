"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

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
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  createNUpPdf,
  nUpOutputSheetCount,
  nUpPdfOutputName,
  resolveNUpGrid,
  type NUpOrientation,
  type NUpPreset,
  type NUpProgress,
} from "@/lib/pdf-n-up";
import {
  DELETE_PAGES_THUMB_SCALE,
  renderPdfPageThumbnail,
} from "@/lib/pdf-delete-pages";
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
const ORIENTATIONS: NUpOrientation[] = ["auto", "portrait", "landscape"];
const MARGIN_OPTIONS = [0, 4, 8, 12, 18, 24] as const;

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

function NUpSheetThumb({
  pageIndex,
  fileBytes,
  loadingLabel,
  sheetLabel,
  previewAria,
  onPreview,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  loadingLabel: string;
  sheetLabel: string;
  previewAria: string;
  onPreview: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageThumbnail(fileBytes, pageIndex, "", DELETE_PAGES_THUMB_SCALE).then(
      (canvas) => {
        if (cancelled || !canvasRef.current) return;
        const node = canvasRef.current;
        node.width = canvas.width;
        node.height = canvas.height;
        const ctx = node.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex]);

  return (
    <div className="page-manage-thumb visual-reorder-card visual-reorder-card--page" role="listitem">
      <span className="visual-reorder-card__index">{sheetLabel}</span>
      <button
        type="button"
        className="page-manage-thumb__preview-btn"
        data-pdf-page-preview=""
        aria-label={previewAria}
        onClick={onPreview}
      >
        <div className="page-manage-thumb__canvas-wrap delete-page-thumb__canvas-wrap">
          {loading ? (
            <p className="page-manage-thumb__loading delete-page-thumb__loading">{loadingLabel}</p>
          ) : null}
          <canvas ref={canvasRef} className="page-manage-thumb__canvas delete-page-thumb__canvas" />
        </div>
      </button>
    </div>
  );
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
  const [orientation, setOrientation] = useState<NUpOrientation>("auto");
  const [marginPt, setMarginPt] = useState<number>(8);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [resultSheetCount, setResultSheetCount] = useState(0);
  const [resultName, setResultName] = useState("");
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
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

  const clearResult = useCallback(() => {
    setResultBytes(null);
    setResultSheetCount(0);
    setResultName("");
    setPreviewPageIndex(null);
    setDone(false);
  }, []);

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(0);
    clearResult();
    setStatus("");
    setProgress(null);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

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
    clearResult();
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
    clearResult();
    setRunError(null);
    setProgress({ phase: "loading", currentSheet: 0, totalSheets: outputSheets });
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, preset });

    try {
      const bytes = await createNUpPdf(
        file,
        {
          preset,
          customCols,
          customRows,
          orientation,
          marginPt,
        },
        (p) => {
          setProgress(p);
          setStatus(labelProgress(p));
        },
      );
      const outName = nUpPdfOutputName(file);
      const sheets = outputSheets || nUpOutputSheetCount(pageCount, grid);
      setResultBytes(bytes);
      setResultSheetCount(sheets);
      setResultName(outName);
      setDone(true);
      setStatus(
        ws.wsStatus("readyPreview", { sheets }) ||
          `N-Up layout ready — preview ${sheets} sheet(s), then download.`,
      );
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, preset });
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

  const onDownload = () => {
    if (!resultBytes || !resultName) return;
    downloadBlob(new Blob([resultBytes as BlobPart], { type: "application/pdf" }), resultName);
    setStatus(
      ws.wsStatus("downloaded", { name: resultName, sheets: resultSheetCount }) ||
        `N-Up PDF downloaded as ${resultName}.`,
    );
    capture(EVENTS.download_click, { operation: tool.operation, slug });
  };

  const showWorkspace = Boolean(file);
  const canConvert = Boolean(file) && !busy;
  const hasResult = Boolean(resultBytes && resultSheetCount > 0);
  const percent = progressPercent(progress, busy);
  const sheetIndices = hasResult
    ? Array.from({ length: resultSheetCount }, (_, index) => index)
    : [];


  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    void pickFile(next);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

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

          <p className="text-xs leading-relaxed text-ink-muted">{ws.wsText("privacyNote")}</p>

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
                    onChange={() => {
                      setPreset(value);
                      clearResult();
                    }}
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
                    onChange={(e) => {
                      setCustomCols(Number(e.target.value));
                      clearResult();
                    }}
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
                    onChange={(e) => {
                      setCustomRows(Number(e.target.value));
                      clearResult();
                    }}
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

          <div className="flex flex-wrap items-end gap-3">
            <div className="protect-form__fields min-w-[9rem]">
              <label className="protect-form__label" htmlFor={`${baseId}-orientation`}>
                {ws.wsUi("orientationLabel")}
              </label>
              <select
                id={`${baseId}-orientation`}
                value={orientation}
                disabled={busy}
                onChange={(e) => {
                  setOrientation(e.target.value as NUpOrientation);
                  clearResult();
                }}
                className="protect-form__input"
              >
                {ORIENTATIONS.map((value) => (
                  <option key={value} value={value}>
                    {ws.wsUi(`orientation_${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="protect-form__fields min-w-[9rem]">
              <label className="protect-form__label" htmlFor={`${baseId}-margin`}>
                {ws.wsUi("marginLabel")}
              </label>
              <select
                id={`${baseId}-margin`}
                value={marginPt}
                disabled={busy}
                onChange={(e) => {
                  setMarginPt(Number(e.target.value));
                  clearResult();
                }}
                className="protect-form__input"
              >
                {MARGIN_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {ws.wsUi("marginOption", { pt: value })}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted pb-2 max-w-sm">
              {ws.wsUi("orientationMarginHint")}
            </p>
          </div>

          {busy ? <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} /> : null}

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={!canConvert}
              onClick={() => void onConvert()}
              className={toolPrimaryBtn}
            >
              {hasResult ? ws.wsText("convertAgainLabel") : ws.wsText("convertLabel")}
            </button>
            {hasResult ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDownload}
                className={toolPrimaryBtn}
              >
                {ws.wsText("downloadLabel") || "Download N-Up PDF"}
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          {hasResult && resultBytes ? (
            <div className="visual-reorder-panel">
              <p className="visual-reorder-panel__hint">
                {ws.wsUi("previewHint") ||
                  "Preview N-Up output sheets below. Click a thumbnail to zoom, then download when ready."}
              </p>
              <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                {sheetIndices.map((pageIndex) => (
                  <NUpSheetThumb
                    key={pageIndex}
                    pageIndex={pageIndex}
                    fileBytes={resultBytes}
                    loadingLabel={ws.wsUi("loadingThumb") || ws.wsCommon("loading") || "Loading…"}
                    sheetLabel={
                      ws.wsUi("sheetLabel", { sheet: pageIndex + 1 }) ||
                      `Sheet ${pageIndex + 1}`
                    }
                    previewAria={
                      ws.wsUi("openSheetPreview", { sheet: pageIndex + 1 }) ||
                      ws.wsCommon("openPagePreview", { page: pageIndex + 1 }) ||
                      `Open larger preview of sheet ${pageIndex + 1}`
                    }
                    onPreview={() => setPreviewPageIndex(pageIndex)}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDownload}
                  className={toolPrimaryBtn}
                >
                  {ws.wsText("downloadLabel") || "Download N-Up PDF"}
                </button>
              </div>

              <PdfPagePreviewModal
                open={previewPageIndex !== null}
                fileBytes={resultBytes}
                pageIndex={previewPageIndex ?? 0}
                password=""
                title={
                  previewPageIndex !== null
                    ? ws.wsUi("sheetOf", {
                        current: previewPageIndex + 1,
                        total: resultSheetCount,
                      }) ||
                      ws.wsCommon("pageOf", {
                        current: previewPageIndex + 1,
                        total: resultSheetCount,
                      }) ||
                      `Sheet ${previewPageIndex + 1} of ${resultSheetCount}`
                    : ""
                }
                closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
                loadingLabel={
                  ws.wsCommon("loadingPagePreview") ||
                  ws.wsUi("loadingThumb") ||
                  "Loading preview…"
                }
                onClose={() => setPreviewPageIndex(null)}
              />
            </div>
          ) : null}
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
            setStatus(file ? ws.wsStatus("tryAgain") || "Try again or choose another file." : "");
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
        label={
          hasResult
            ? ws.wsText("downloadLabel") || "Download N-Up PDF"
            : ws.wsText("convertLabel")
        }
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
