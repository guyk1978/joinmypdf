"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import { DELETE_PAGES_THUMB_SCALE, loadPdfPageCount, renderPdfPageThumbnail } from "@/lib/pdf-delete-pages";
import { extractPdfOutputName, parsePageRangeSpec } from "@/lib/pdf-pages";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function ExtractPreviewThumb({
  pageIndex,
  fileBytes,
  password,
  loadingLabel,
  pageLabel,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  loadingLabel: string;
  pageLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageThumbnail(fileBytes, pageIndex, password, DELETE_PAGES_THUMB_SCALE).then(
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
  }, [fileBytes, pageIndex, password]);

  return (
    <div className="page-manage-thumb visual-reorder-card visual-reorder-card--page is-selected">
      <span className="visual-reorder-card__index">{pageLabel}</span>
      <div className="page-manage-thumb__canvas-wrap">
        {loading ? <p className="page-manage-thumb__loading">{loadingLabel}</p> : null}
        <canvas ref={canvasRef} className="page-manage-thumb__canvas" />
      </div>
    </div>
  );
}

export function ExtractPdfPagesWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeSpec, setRangeSpec] = useState("");
  const [parseError, setParseError] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const selectedIndices = useMemo(() => {
    if (!pageCount || !rangeSpec.trim()) return [];
    try {
      return parsePageRangeSpec(rangeSpec, pageCount);
    } catch {
      return [];
    }
  }, [pageCount, rangeSpec]);

  useEffect(() => {
    if (!rangeSpec.trim()) {
      setParseError("");
      return;
    }
    try {
      parsePageRangeSpec(rangeSpec, pageCount);
      setParseError("");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : ws.wsStatus("invalidRange"));
    }
  }, [rangeSpec, pageCount, ws]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setRangeSpec("");
    setParseError("");
    setPassword("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setRangeSpec("");
      setParseError("");
      setDone(false);
      setRunError(null);
      setPassword("");

      try {
        const count = await loadPdfPageCount(bytes, password);
        setPageCount(count);
        setStatus(ws.wsStatus("loaded", { count }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [password, tool.operation, ws],
  );

  const onDownload = async () => {
    if (!file || !fileBytes || busy) return;
    if (!rangeSpec.trim()) {
      setStatus(ws.wsStatus("enterRange"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.extractPdfPagesFile(file, rangeSpec, password);
      const outName = extractPdfOutputName(file.name);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName, count: selectedIndices.length }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
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
    }
  };

  const previewIndices = selectedIndices.slice(0, 12);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
        {!file ? (
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
              void addFile(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) void addFile(e.target.files);
                  e.target.value = "";
                }}
              />
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="truncate text-sm text-ink-muted">
                <span className="font-medium text-ink">{file.name}</span>
                {pageCount ? (
                  <span className="ms-2">{ws.wsUi("pageCountLabel", { count: pageCount })}</span>
                ) : null}
              </p>
              <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
                {ws.chooseAnotherFile}
              </button>
            </div>

            <div className="grid gap-3 rounded-none border border-neutral-400/30 bg-neutral-500/[0.06] p-4 ring-1 ring-neutral-400/20 backdrop-blur-md dark:border-neutral-400/40 dark:bg-neutral-500/10">
              <label className="block text-sm">
                <span className="font-semibold text-ink">{ws.wsUi("rangeLabel")}</span>
                <input
                  type="text"
                  value={rangeSpec}
                  onChange={(e) => setRangeSpec(e.target.value)}
                  placeholder={ws.wsUi("rangePlaceholder")}
                  className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  disabled={busy}
                />
              </label>
              <p className="text-xs text-ink-muted">{ws.wsUi("rangeHint")}</p>
              {parseError ? <p className="text-xs text-neutral-600 dark:text-neutral-400">{parseError}</p> : null}
              {!parseError && selectedIndices.length ? (
                <p className="text-sm text-ink">
                  {ws.wsUi("selectionSummary", { count: selectedIndices.length })}
                </p>
              ) : null}
            </div>

            {fileBytes && previewIndices.length > 0 && !parseError ? (
              <div className="visual-reorder-panel">
                <p className="visual-reorder-panel__hint">{ws.wsUi("previewHint")}</p>
                <div className="delete-pages-grid visual-reorder-grid page-manage-grid" role="list">
                  {previewIndices.map((pageIndex) => (
                    <ExtractPreviewThumb
                      key={`${pageIndex}-${rangeSpec}`}
                      pageIndex={pageIndex}
                      fileBytes={fileBytes}
                      password={password}
                      loadingLabel={ws.wsUi("loadingThumb")}
                      pageLabel={ws.wsCommon("pageNumber", { page: pageIndex + 1 })}
                    />
                  ))}
                </div>
                {selectedIndices.length > previewIndices.length ? (
                  <p className="text-xs text-ink-muted">
                    {ws.wsUi("previewMore", {
                      more: selectedIndices.length - previewIndices.length,
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={toolPrimaryBtn}
                disabled={busy || !selectedIndices.length || Boolean(parseError)}
                onClick={() => void onDownload()}
              >
                {busy ? ws.wsText("applyingLabel") : ws.buttonLabel()}
              </button>
            </div>
          </>
        )}
      </WorkspaceUploadShell>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(ws.wsStatus("adjustFile"));
          }}
        />
      ) : status ? (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}
      <StickyMobileCta
        href="#tool-workspace"
        label={ws.buttonLabel()}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
