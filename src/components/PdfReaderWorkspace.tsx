"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { openPdfDocument, renderPdfReaderPage, type PdfJsDocument } from "@/lib/pdf-reader";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { setDocFullscreenActive } from "@/lib/doc-fullscreen";
import type { ToolDefinition } from "@/lib/types";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import "./pdf-reader-workspace.css";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestElementFullscreen(el: HTMLElement) {
  const node = el as FullscreenCapableElement;
  if (typeof node.requestFullscreen === "function") {
    await node.requestFullscreen();
    return;
  }
  if (typeof node.webkitRequestFullscreen === "function") {
    await node.webkitRequestFullscreen();
  }
}

async function exitDocumentFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === "function" && getFullscreenElement()) {
    await doc.webkitExitFullscreen();
  }
}

export function PdfReaderWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const pageShell = useToolPageShell();
  const tPage = useTranslations("PdfReaderPage");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [fsMode, setFsMode] = useState<"off" | "native" | "css">("off");
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PdfJsDocument | null>(null);
  const renderTokenRef = useRef(0);
  const fsModeRef = useRef(fsMode);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();
  fsModeRef.current = fsMode;
  const docFullscreen = fsMode !== "off";
  const [fitScale, setFitScale] = useState(1);

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const destroyDoc = useCallback(async () => {
    const doc = docRef.current;
    docRef.current = null;
    if (doc) {
      try {
        await doc.destroy();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const reset = useCallback(() => {
    void destroyDoc();
    setFile(null);
    setPageCount(0);
    setPageNumber(1);
    setZoom(1.15);
    setStatus("");
    setRunError(null);
    setRendering(false);
    setFsMode("off");
    if (getFullscreenElement()) {
      void exitDocumentFullscreen().catch(() => undefined);
    }
    if (inputRef.current) inputRef.current.value = "";
  }, [destroyDoc]);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }
    setBusy(true);
    setRunError(null);
    setStatus(ws.wsStatus("reading"));
    try {
      await destroyDoc();
      const bytes = new Uint8Array(await next.arrayBuffer());
      const doc = await openPdfDocument(bytes);
      docRef.current = doc;
      setFile(next);
      setPageCount(doc.numPages);
      setPageNumber(1);
      setZoom(1.15);
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
    } catch (e) {
      await destroyDoc();
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setPageCount(0);
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

  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!file || !doc || !canvas) return;

    const token = ++renderTokenRef.current;
    let cancelled = false;
    setRendering(true);

    void (async () => {
      try {
        await renderPdfReaderPage({
          doc,
          pageNumber,
          scale: zoom,
          canvas,
          textLayerEl: textLayerRef.current,
        });
        if (!cancelled && token === renderTokenRef.current) {
          setRendering(false);
        }
      } catch (e) {
        if (cancelled || token !== renderTokenRef.current) return;
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, pageNumber, zoom]);

  useEffect(() => {
    return () => {
      void destroyDoc();
    };
  }, [destroyDoc]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = getFullscreenElement();
      if (active && active === viewportRef.current) {
        setFsMode("native");
        return;
      }
      if (fsModeRef.current === "native") {
        setFsMode("off");
      }
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (fsMode !== "css") return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [fsMode]);

  useEffect(() => {
    setDocFullscreenActive(docFullscreen);
    return () => setDocFullscreenActive(false);
  }, [docFullscreen]);

  useEffect(() => {
    if (!docFullscreen) {
      setFitScale(1);
      return;
    }
    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    const updateFit = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const naturalW = canvas.width || canvas.getBoundingClientRect().width;
      const naturalH = canvas.height || canvas.getBoundingClientRect().height;
      if (!naturalW || !naturalH) return;
      const padX = 24;
      const padY = 96; // room for fullscreen toolbar
      const availW = Math.max(120, viewport.clientWidth - padX);
      const availH = Math.max(120, viewport.clientHeight - padY);
      const next = Math.min(1, availW / naturalW, availH / naturalH);
      setFitScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    updateFit();
    const ro = new ResizeObserver(updateFit);
    ro.observe(viewport);
    ro.observe(page);
    return () => ro.disconnect();
  }, [docFullscreen, pageNumber, zoom, rendering]);

  useEffect(() => {
    if (!docFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Own Escape in this turn so the parent ToolModal does not close the session.
        event.preventDefault();
        event.stopPropagation();
        setFsMode("off");
        if (getFullscreenElement()) void exitDocumentFullscreen().catch(() => undefined);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setPageNumber((n) => Math.max(1, n - 1));
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setPageNumber((n) => Math.min(pageCount, n + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [docFullscreen, pageCount]);

  const toggleDocFullscreen = useCallback(async () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (fsMode !== "off" || getFullscreenElement() === viewport) {
      setFsMode("off");
      if (getFullscreenElement()) {
        try {
          await exitDocumentFullscreen();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    try {
      await requestElementFullscreen(viewport);
      setFsMode("native");
    } catch {
      // Fallback for browsers without Fullscreen API (common on iOS).
      setFsMode("css");
    }
  }, [fsMode]);

  const showWorkspace = Boolean(file && pageCount > 0);
  const zoomPct = Math.round(zoom * 100);
  const showUploadHead = !showWorkspace && !pageShell.stacked;
  const enterFullscreenLabel = ws.wsUi("enterFullscreen");
  const exitFullscreenLabel = ws.wsUi("exitFullscreen");

  return (
    <div id="tool-workspace" className="pdf-reader-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8">
      {showUploadHead ? (
        <header className="pdf-reader-upload-head">
          <h1 className="pdf-reader-upload-head__title">
            {tPage.has("title") ? tPage("title") : "PDF Reader Online"}
          </h1>
          <p className="pdf-reader-upload-head__subtitle">
            {ws.uploadDescription() ||
              (tPage.has("schemaDescription")
                ? tPage("schemaDescription")
                : "Read and inspect PDFs privately in your browser.")}
          </p>
        </header>
      ) : null}

      <WorkspaceUploadShell active={showWorkspace}>
        {!showWorkspace ? (
          <FileUploadZone
            operation={tool.operation}
            slug={slug}
            drag={drag}
            role="button"
            tabIndex={0}
            aria-controls={`${baseId}-input`}
            className="cursor-pointer"
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
        <div
          id={WORKSPACE_OPERATIONS_ID}
          className="space-y-3 rounded-none border border-neutral-300 bg-white p-3 md:p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{file?.name}</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {ws.wsUi("pageSummary", { count: pageCount })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="pdf-reader-toolbar" role="toolbar" aria-label={ws.wsUi("toolbarLabel")}>
            <div className="pdf-reader-toolbar__group">
              <button
                type="button"
                className="pdf-reader-toolbar__btn"
                disabled={busy || rendering || pageNumber <= 1}
                onClick={() => setPageNumber((n) => Math.max(1, n - 1))}
              >
                {ws.wsUi("prevPage")}
              </button>
              <label className="pdf-reader-toolbar__page">
                <span className="sr-only">{ws.wsUi("jumpToPage")}</span>
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageNumber}
                  disabled={busy || rendering}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    setPageNumber(Math.min(pageCount, Math.max(1, Math.floor(next))));
                  }}
                  aria-label={ws.wsUi("jumpToPage")}
                />
                <span>/ {pageCount}</span>
              </label>
              <button
                type="button"
                className="pdf-reader-toolbar__btn"
                disabled={busy || rendering || pageNumber >= pageCount}
                onClick={() => setPageNumber((n) => Math.min(pageCount, n + 1))}
              >
                {ws.wsUi("nextPage")}
              </button>
            </div>

            <div className="pdf-reader-toolbar__group">
              <button
                type="button"
                className="pdf-reader-toolbar__btn pdf-reader-toolbar__btn--icon"
                disabled={busy || rendering || zoom <= ZOOM_MIN}
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))))}
                aria-label={ws.wsUi("zoomOut")}
                title={ws.wsUi("zoomOut")}
              >
                <ZoomOut className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                <span className="pdf-reader-toolbar__btn-label">{ws.wsUi("zoomOut")}</span>
              </button>
              <span className="pdf-reader-toolbar__zoom" aria-live="polite">
                {zoomPct}%
              </span>
              <button
                type="button"
                className="pdf-reader-toolbar__btn pdf-reader-toolbar__btn--icon"
                disabled={busy || rendering || zoom >= ZOOM_MAX}
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))))}
                aria-label={ws.wsUi("zoomIn")}
                title={ws.wsUi("zoomIn")}
              >
                <ZoomIn className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                <span className="pdf-reader-toolbar__btn-label">{ws.wsUi("zoomIn")}</span>
              </button>
              <button
                type="button"
                className="pdf-reader-toolbar__btn"
                disabled={busy || rendering}
                onClick={() => setZoom(1.15)}
              >
                {ws.wsUi("zoomReset")}
              </button>
              <button
                type="button"
                className="pdf-reader-toolbar__btn pdf-reader-toolbar__btn--icon"
                disabled={busy || rendering}
                aria-pressed={docFullscreen}
                aria-label={docFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                title={docFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                onClick={() => void toggleDocFullscreen()}
              >
                {docFullscreen ? (
                  <Minimize2 className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                ) : (
                  <Maximize2 className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                )}
                <span className="pdf-reader-toolbar__btn-label">
                  {docFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                </span>
              </button>
            </div>

            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400">{ws.wsUi("selectHint")}</p>

          <div
            ref={viewportRef}
            className={[
              "pdf-reader-viewport",
              docFullscreen ? "pdf-reader-viewport--fullscreen" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-busy={rendering || busy}
          >
            {docFullscreen ? (
              <div className="pdf-reader-viewport__fs-toolbar" role="toolbar" aria-label={ws.wsUi("toolbarLabel")}>
                <div className="pdf-reader-toolbar__group">
                  <button
                    type="button"
                    className="pdf-reader-toolbar__btn"
                    disabled={busy || rendering || pageNumber <= 1}
                    onClick={() => setPageNumber((n) => Math.max(1, n - 1))}
                  >
                    {ws.wsUi("prevPage")}
                  </button>
                  <span className="pdf-reader-toolbar__page pdf-reader-toolbar__page--static" aria-live="polite">
                    {pageNumber} / {pageCount}
                  </span>
                  <button
                    type="button"
                    className="pdf-reader-toolbar__btn"
                    disabled={busy || rendering || pageNumber >= pageCount}
                    onClick={() => setPageNumber((n) => Math.min(pageCount, n + 1))}
                  >
                    {ws.wsUi("nextPage")}
                  </button>
                </div>
                <div className="pdf-reader-toolbar__group">
                  <button
                    type="button"
                    className="pdf-reader-toolbar__btn pdf-reader-toolbar__btn--icon"
                    disabled={busy || rendering || zoom <= ZOOM_MIN}
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))))}
                    aria-label={ws.wsUi("zoomOut")}
                  >
                    <ZoomOut className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                  </button>
                  <span className="pdf-reader-toolbar__zoom" aria-live="polite">
                    {zoomPct}%
                  </span>
                  <button
                    type="button"
                    className="pdf-reader-toolbar__btn pdf-reader-toolbar__btn--icon"
                    disabled={busy || rendering || zoom >= ZOOM_MAX}
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))))}
                    aria-label={ws.wsUi("zoomIn")}
                  >
                    <ZoomIn className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="pdf-reader-viewport__exit-fs"
                    onClick={() => void toggleDocFullscreen()}
                    aria-label={exitFullscreenLabel}
                  >
                    <Minimize2 className="pdf-reader-toolbar__icon" aria-hidden strokeWidth={2} />
                    <span>{exitFullscreenLabel}</span>
                  </button>
                </div>
              </div>
            ) : null}
            <div
              ref={pageRef}
              className="pdf-reader-page"
              style={
                docFullscreen && fitScale < 1
                  ? { transform: `scale(${fitScale})`, transformOrigin: "top center" }
                  : undefined
              }
            >
              <canvas ref={canvasRef} className="pdf-reader-page__canvas" />
              <div ref={textLayerRef} className="textLayer pdf-reader-page__text" />
            </div>
            {rendering ? (
              <div className="pdf-reader-viewport__loading" aria-live="polite">
                {ws.wsCommon("loadingPreview") || ws.processing}
              </div>
            ) : null}
            {docFullscreen ? (
              <p className="pdf-reader-viewport__fs-hint" aria-hidden>
                Esc · ← →
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-500">{ws.wsText("privacyNote")}</p>
        </div>
      ) : null}

      <div className="tool-workspace-feedback space-y-3">
        {runError ? (
          <ToolErrorRecovery
            operation={tool.operation}
            slug={slug}
            kind={runError.kind}
            technicalMessage={runError.message}
            onDismiss={() => {
              setRunError(null);
              setStatus(file ? ws.wsStatus("tryAgain") : "");
              inputRef.current?.click();
            }}
          />
        ) : status ? (
          <p className="text-sm text-neutral-700 dark:text-neutral-300" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}

        {!showWorkspace && busy ? (
          <div className="workspace-progress-host space-y-2" aria-live="polite" role="status">
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>{ws.processing}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-none bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full w-2/3 animate-pulse rounded-none bg-neutral-700 dark:bg-neutral-300" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
