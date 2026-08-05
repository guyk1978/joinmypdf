"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import { PdfPagePreviewModal } from "@/components/PdfPagePreviewModal";
import { PdfThumbCanvas } from "@/components/PdfThumbCanvas";
import { DELETE_PAGES_THUMB_SCALE, loadPdfPageCount } from "@/lib/pdf-delete-pages";
import {
  extractPdfOutputName,
  formatPageRangeSpec,
  parsePageRangeSpec,
} from "@/lib/pdf-pages";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolOutlineBtn, toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { clsx } from "clsx";
import { Check, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
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

function ExtractPageThumb({
  pageIndex,
  fileBytes,
  password,
  selected,
  loadingLabel,
  pageLabel,
  selectAria,
  previewAria,
  onToggle,
  onPreview,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  selected: boolean;
  loadingLabel: string;
  pageLabel: string;
  selectAria: string;
  previewAria: string;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const tCommon = useTranslations("Workspaces.common");
  const failedLabel = tCommon.has("previewFailed")
    ? tCommon("previewFailed")
    : "Could not render this page.";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={clsx("extract-page-thumb", selected && "is-selected")}
      role="listitem"
      data-selected={selected ? "1" : "0"}
    >
      <span className="extract-page-thumb__index" aria-hidden>
        {pageIndex + 1}
      </span>
      <button
        type="button"
        className="extract-page-thumb__select"
        aria-pressed={selected}
        aria-label={selectAria}
        onClick={onToggle}
      >
        <div ref={wrapRef} className="relative">
          {!visible ? (
            <div className="extract-page-thumb__canvas-wrap">
              <p className="extract-page-thumb__loading">{loadingLabel}</p>
            </div>
          ) : (
            <>
              <PdfThumbCanvas
                fileBytes={fileBytes}
                pageIndex={pageIndex}
                password={password}
                scale={DELETE_PAGES_THUMB_SCALE}
                loadingLabel={loadingLabel}
                failedLabel={failedLabel}
                enabled={visible}
                wrapClassName="extract-page-thumb__canvas-wrap"
                canvasClassName="extract-page-thumb__canvas"
                loadingClassName="extract-page-thumb__loading"
              />
              {selected ? (
                <span className="extract-page-thumb__check" aria-hidden>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              ) : null}
            </>
          )}
        </div>
        <span className="extract-page-thumb__label">{pageLabel}</span>
      </button>
      <button
        type="button"
        className="extract-page-thumb__zoom"
        data-pdf-page-preview=""
        aria-label={previewAria}
        title={previewAria}
        onClick={onPreview}
      >
        <ZoomIn size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

export function ExtractPdfPagesWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeSpec, setRangeSpec] = useState("");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [parseError, setParseError] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const selectedIndices = useMemo(
    () => [...selected].sort((a, b) => a - b),
    [selected],
  );

  const applySelection = useCallback((next: Set<number>) => {
    setSelected(next);
    setRangeSpec(formatPageRangeSpec([...next]));
    setParseError("");
  }, []);

  const onRangeChange = useCallback(
    (value: string) => {
      setRangeSpec(value);
      if (!value.trim()) {
        setSelected(new Set());
        setParseError("");
        return;
      }
      if (!pageCount) return;
      try {
        const indices = parsePageRangeSpec(value, pageCount);
        setSelected(new Set(indices));
        setParseError("");
      } catch (e) {
        setParseError(e instanceof Error ? e.message : ws.wsStatus("invalidRange"));
      }
    },
    [pageCount, ws],
  );

  const togglePage = useCallback(
    (pageIndex: number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(pageIndex)) next.delete(pageIndex);
        else next.add(pageIndex);
        setRangeSpec(formatPageRangeSpec([...next]));
        setParseError("");
        return next;
      });
    },
    [],
  );

  const selectAll = useCallback(() => {
    if (!pageCount) return;
    applySelection(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  }, [applySelection, pageCount]);

  const clearSelection = useCallback(() => {
    applySelection(new Set());
  }, [applySelection]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setRangeSpec("");
    setSelected(new Set());
    setParseError("");
    setPassword("");
    setStatus("");
    setDone(false);
    setRunError(null);
    setPreviewPageIndex(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    async (
      incoming: FileList | File[],
      options?: { rangeSpec?: string },
    ) => {
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
      setSelected(new Set());
      setParseError("");
      setDone(false);
      setRunError(null);
      setPassword("");
      setPreviewPageIndex(null);

      try {
        const count = await loadPdfPageCount(bytes, password);
        setPageCount(count);
        const restored = options?.rangeSpec?.trim();
        if (restored) {
          try {
            const indices = parsePageRangeSpec(restored, count);
            setSelected(new Set(indices));
            setRangeSpec(formatPageRangeSpec(indices));
            setParseError("");
          } catch (e) {
            setRangeSpec(restored);
            setParseError(e instanceof Error ? e.message : ws.wsStatus("invalidRange"));
          }
        }
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
    const spec = rangeSpec.trim() || formatPageRangeSpec(selectedIndices);
    if (!spec) {
      setStatus(ws.wsStatus("enterRange"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.extractPdfPagesFile(file, spec, password);
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

  const onRestoreProject = useCallback(
    (payload: { files: File[]; settings?: Record<string, unknown> }) => {
      const next = payload.files[0];
      if (!next) return;
      const saved = payload.settings?.rangeSpec;
      void addFile([next], {
        rangeSpec: typeof saved === "string" ? saved : undefined,
      });
    },
    [addFile],
  );

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    settings: { rangeSpec },
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  const pageIndices = useMemo(
    () => (pageCount > 0 ? Array.from({ length: pageCount }, (_, i) => i) : []),
    [pageCount],
  );

  const canExtract =
    Boolean(file) && selectedIndices.length > 0 && !busy && !parseError;

  return (
    <div id="tool-workspace" className="extract-pdf-pages-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={Boolean(file)}>
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
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="truncate text-sm text-neutral-400">
              <span className="font-medium text-neutral-100">{file.name}</span>
              {pageCount ? (
                <span className="ms-2">{ws.wsUi("pageCountLabel", { count: pageCount })}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
                {ws.chooseAnotherFile}
              </button>
              <WorkspaceNewUploadButton
                label={ws.uploadNewFile}
                disabled={busy}
                onClick={() => startNewUpload(reset)}
              />
            </div>
          </div>

          <div className="tool-workspace-panel space-y-3" id={WORKSPACE_OPERATIONS_ID} data-embed-measure="">
            <label className="block text-sm" htmlFor={`${baseId}-range`}>
              <span className="font-semibold text-neutral-100">{ws.wsUi("rangeLabel")}</span>
              <input
                id={`${baseId}-range`}
                type="text"
                value={rangeSpec}
                onChange={(e) => onRangeChange(e.target.value)}
                placeholder={ws.wsUi("rangePlaceholder")}
                className="extract-pages-range-input mt-1 w-full px-3 py-2 font-mono text-sm"
                disabled={busy}
              />
            </label>
            <p className="text-xs text-neutral-400">{ws.wsUi("rangeHint")}</p>
            {parseError ? <p className="text-xs text-rose-300">{parseError}</p> : null}
            {!parseError && selectedIndices.length ? (
              <p className="text-sm text-neutral-200">
                {ws.wsUi("selectionSummary", { count: selectedIndices.length })}
              </p>
            ) : null}

            {fileBytes && pageCount > 0 ? (
              <div className="extract-pages-preview">
                <div className="extract-pages-preview__toolbar">
                  <p className="extract-pages-preview__hint">{ws.wsUi("previewHint")}</p>
                  <div className="extract-pages-preview__actions">
                    <button
                      type="button"
                      className={toolOutlineBtn}
                      disabled={busy || selectedIndices.length === pageCount}
                      onClick={selectAll}
                    >
                      {ws.wsUi("selectAll") || ws.wsCommon("selectAll") || "Select all"}
                    </button>
                    <button
                      type="button"
                      className={toolOutlineBtn}
                      disabled={busy || selectedIndices.length === 0}
                      onClick={clearSelection}
                    >
                      {ws.wsUi("clearSelection") || "Clear selection"}
                    </button>
                  </div>
                </div>

                <div className="extract-pages-grid" role="list" aria-label={ws.wsUi("gridLabel") || "PDF pages"}>
                  {pageIndices.map((pageIndex) => (
                    <ExtractPageThumb
                      key={pageIndex}
                      pageIndex={pageIndex}
                      fileBytes={fileBytes}
                      password={password}
                      selected={selected.has(pageIndex)}
                      loadingLabel={ws.wsUi("loadingThumb")}
                      pageLabel={ws.wsCommon("pageNumber", { page: pageIndex + 1 })}
                      selectAria={
                        selected.has(pageIndex)
                          ? ws.wsUi("deselectPageAria", { page: pageIndex + 1 }) ||
                            `Deselect page ${pageIndex + 1}`
                          : ws.wsUi("selectPageAria", { page: pageIndex + 1 }) ||
                            `Select page ${pageIndex + 1}`
                      }
                      previewAria={
                        ws.wsCommon("openPagePreview", { page: pageIndex + 1 }) ||
                        `Open larger preview of page ${pageIndex + 1}`
                      }
                      onToggle={() => togglePage(pageIndex)}
                      onPreview={() => setPreviewPageIndex(pageIndex)}
                    />
                  ))}
                </div>

                <PdfPagePreviewModal
                  open={previewPageIndex !== null}
                  fileBytes={fileBytes}
                  pageIndex={previewPageIndex ?? 0}
                  password={password}
                  title={
                    previewPageIndex !== null
                      ? ws.wsCommon("pageOf", {
                          current: previewPageIndex + 1,
                          total: pageCount,
                        }) || `Page ${previewPageIndex + 1} of ${pageCount}`
                      : ""
                  }
                  closeLabel={ws.wsCommon("closePagePreview") || "Close page preview"}
                  loadingLabel={ws.wsCommon("loadingPagePreview") || ws.wsUi("loadingThumb")}
                  zoomInLabel={ws.wsCommon("zoomIn") || "Zoom in"}
                  zoomOutLabel={ws.wsCommon("zoomOut") || "Zoom out"}
                  onClose={() => setPreviewPageIndex(null)}
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2" data-workspace-actions="">
              <button
                type="button"
                className={toolPrimaryBtn}
                disabled={!canExtract}
                onClick={() => void onDownload()}
              >
                {busy ? ws.wsText("applyingLabel") : ws.buttonLabel()}
              </button>
            </div>
          </div>
        </>
      ) : null}

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
        <p className="text-sm text-neutral-400" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
      <StickyMobileCta
        href="#tool-workspace"
        label={ws.buttonLabel()}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
