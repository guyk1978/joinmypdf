"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PdfThumbCanvas } from "@/components/PdfThumbCanvas";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { openPdfDocument, renderPdfReaderPage, type PdfJsDocument } from "@/lib/pdf-reader";
import { canvasHasVisibleInk } from "@/lib/pdf-paint";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { setDocFullscreenActive } from "@/lib/doc-fullscreen";
import type { ToolDefinition } from "@/lib/types";
import { clsx } from "clsx";
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
const ZOOM_MAX = 5;
const ZOOM_DEFAULT = 1.15;
const ZOOM_SLIDER_STEP = 0.01;
const ZOOM_BUTTON_STEP = 0.1;
/** Debounce PDF.js re-renders while the slider drags; CSS scales instantly. */
const ZOOM_RENDER_DEBOUNCE_MS = 90;
const PDF_READER_THUMB_SCALE = 0.18;
const CANVAS_ATTACH_MAX_FRAMES = 12;

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

function PdfReaderZoomSlider({
  zoom,
  disabled,
  zoomInLabel,
  zoomOutLabel,
  onZoomChange,
}: {
  zoom: number;
  disabled?: boolean;
  zoomInLabel: string;
  zoomOutLabel: string;
  onZoomChange: (next: number) => void;
}) {
  const zoomId = useId();
  const pct = `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%`;

  return (
    <div className="pdf-reader-zoom" role="group" aria-label="Zoom">
      <button
        type="button"
        className="pdf-reader-zoom__btn"
        disabled={disabled || zoom <= ZOOM_MIN}
        aria-label={zoomOutLabel}
        title={zoomOutLabel}
        onClick={() => onZoomChange(clampZoom(zoom - ZOOM_BUTTON_STEP))}
      >
        <ZoomOut className="pdf-reader-zoom__icon pdf-reader-zoom__icon--out" aria-hidden strokeWidth={2} />
      </button>
      <label className="pdf-reader-zoom__slider-wrap" htmlFor={zoomId}>
        <span className="sr-only">{Math.round(zoom * 100)}%</span>
        <input
          id={zoomId}
          type="range"
          className="pdf-reader-zoom__slider"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={ZOOM_SLIDER_STEP}
          value={zoom}
          disabled={disabled}
          style={{ ["--pdf-reader-zoom-pct" as string]: pct }}
          aria-valuemin={ZOOM_MIN}
          aria-valuemax={ZOOM_MAX}
          aria-valuenow={zoom}
          aria-valuetext={`${Math.round(zoom * 100)}%`}
          onInput={(event) => onZoomChange(clampZoom(Number((event.target as HTMLInputElement).value)))}
          onChange={(event) => onZoomChange(clampZoom(Number(event.target.value)))}
        />
      </label>
      <button
        type="button"
        className="pdf-reader-zoom__btn"
        disabled={disabled || zoom >= ZOOM_MAX}
        aria-label={zoomInLabel}
        title={zoomInLabel}
        onClick={() => onZoomChange(clampZoom(zoom + ZOOM_BUTTON_STEP))}
      >
        <ZoomIn className="pdf-reader-zoom__icon pdf-reader-zoom__icon--in" aria-hidden strokeWidth={2} />
      </button>
      <span className="pdf-reader-toolbar__zoom" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}

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

function PdfReaderSidebarThumb({
  pageIndex,
  pageNumber,
  active,
  fileBytes,
  password,
  loadingLabel,
  failedLabel,
  pageLabel,
  onSelect,
}: {
  pageIndex: number;
  pageNumber: number;
  active: boolean;
  fileBytes: Uint8Array;
  password: string;
  loadingLabel: string;
  failedLabel: string;
  pageLabel: string;
  onSelect: () => void;
}) {
  const wrapRef = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

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
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    wrapRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <li ref={wrapRef} className={clsx("pdf-reader-thumb", active && "is-active")}>
      <button
        type="button"
        className="pdf-reader-thumb__btn"
        aria-current={active ? "page" : undefined}
        aria-label={pageLabel}
        onClick={onSelect}
      >
        {visible ? (
          <PdfThumbCanvas
            fileBytes={fileBytes}
            pageIndex={pageIndex}
            password={password}
            scale={PDF_READER_THUMB_SCALE}
            loadingLabel={loadingLabel}
            failedLabel={failedLabel}
            enabled={visible}
            wrapClassName="pdf-reader-thumb__canvas-wrap"
            canvasClassName="pdf-reader-thumb__canvas"
            loadingClassName="pdf-reader-thumb__loading"
          />
        ) : (
          <div className="pdf-reader-thumb__canvas-wrap">
            <p className="pdf-reader-thumb__loading">{loadingLabel}</p>
          </div>
        )}
        <span className="pdf-reader-thumb__label" aria-hidden>
          {pageNumber}
        </span>
      </button>
    </li>
  );
}

export function PdfReaderWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const tPage = useTranslations("PdfReaderPage");
  const tCommon = useTranslations("Workspaces.common");
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [pageRenderError, setPageRenderError] = useState("");
  const [renderNonce, setRenderNonce] = useState(0);
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
  /** Last scale successfully drawn by PDF.js — CSS bridges instantly to `zoom`. */
  const [renderedZoom, setRenderedZoom] = useState(ZOOM_DEFAULT);
  const [pageDisplaySize, setPageDisplaySize] = useState({ w: 0, h: 0 });
  const zoomRef = useRef(zoom);
  const lastRenderKeyRef = useRef("");
  zoomRef.current = zoom;

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
    setFileBytes(null);
    setPassword("");
    setPageCount(0);
    setPageNumber(1);
    setZoom(ZOOM_DEFAULT);
    setRenderedZoom(ZOOM_DEFAULT);
    setPageDisplaySize({ w: 0, h: 0 });
    setStatus("");
    setRunError(null);
    setPageRenderError("");
    setRenderNonce(0);
    setRendering(false);
    setFsMode("off");
    if (getFullscreenElement()) {
      void exitDocumentFullscreen().catch(() => undefined);
    }
    if (inputRef.current) inputRef.current.value = "";
  }, [destroyDoc]);

  const pickFile = useCallback(
    async (next: File) => {
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
      setPageRenderError("");
      setStatus(ws.wsStatus("reading"));
      const bytes = new Uint8Array(await next.arrayBuffer());
      setFileBytes(bytes);
      setPassword("");
      try {
        await destroyDoc();
        const doc = await openPdfDocument(bytes);
        docRef.current = doc;
        setFile(next);
        setPageCount(doc.numPages);
        setPageNumber(1);
        setZoom(ZOOM_DEFAULT);
        setRenderedZoom(ZOOM_DEFAULT);
        setPageDisplaySize({ w: 0, h: 0 });
        setStatus(ws.wsStatus("fileReady", { name: next.name }));
        capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
        capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      } catch (e) {
        await destroyDoc();
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
        if (parsed.kind === "encrypted") {
          setFile(next);
        } else {
          setFile(null);
          setFileBytes(null);
        }
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
    },
    [acceptPdf, destroyDoc, slug, tool.operation, ws],
  );

  const unlockWithPassword = useCallback(async () => {
    if (!fileBytes) return;
    setBusy(true);
    setRunError(null);
    setPageRenderError("");
    setStatus(ws.wsStatus("reading"));
    try {
      await destroyDoc();
      const doc = await openPdfDocument(fileBytes, password);
      docRef.current = doc;
      setPageCount(doc.numPages);
      setPageNumber(1);
      setZoom(ZOOM_DEFAULT);
      setRenderedZoom(ZOOM_DEFAULT);
      setPageDisplaySize({ w: 0, h: 0 });
      const name = file?.name ?? "document.pdf";
      setStatus(ws.wsStatus("fileReady", { name }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
    } catch (e) {
      await destroyDoc();
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
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
  }, [destroyDoc, file, fileBytes, password, slug, tool.operation, ws]);

  // PWA File Handling API — open OS-associated PDFs directly in this reader.
  const pickFileRef = useRef(pickFile);
  pickFileRef.current = pickFile;

  useEffect(() => {
    type LaunchQueueWindow = Window & {
      launchQueue?: {
        setConsumer: (
          callback: (params: { files: FileSystemFileHandle[] }) => void | Promise<void>,
        ) => void;
      };
    };
    const launchQueue = (window as LaunchQueueWindow).launchQueue;
    if (!launchQueue?.setConsumer) return;

    launchQueue.setConsumer(async (launchParams) => {
      const handles = launchParams.files;
      if (!handles?.length) return;
      try {
        const file = await handles[0]!.getFile();
        await pickFileRef.current(file);
      } catch {
        /* user cancelled permission or handle invalid */
      }
    });
  }, []);

  useEffect(() => {
    const doc = docRef.current;
    if (!file || !doc) return;

    const token = ++renderTokenRef.current;
    const renderKey = `${file.name}:${file.size}:${file.lastModified}:${pageNumber}:${renderNonce}`;
    const delay =
      lastRenderKeyRef.current !== renderKey ? 0 : ZOOM_RENDER_DEBOUNCE_MS;
    lastRenderKeyRef.current = renderKey;

    let cancelled = false;
    let rafHandle = 0;
    let timer = 0;

    const finishRendering = () => {
      if (!cancelled && token === renderTokenRef.current) {
        setRendering(false);
      }
    };

    const runRender = (canvas: HTMLCanvasElement) => {
      const scaleToRender = Math.max(0.35, zoomRef.current);
      setRendering(true);
      setPageRenderError("");
      void (async () => {
        try {
          if (process.env.NODE_ENV === "development") {
            const stage = viewportRef.current?.querySelector(
              ".pdf-reader-viewport__stage",
            ) as HTMLElement | null;
            console.info("[pdf-reader] render start", {
              pageNumber,
              scaleToRender,
              stageW: stage?.clientWidth ?? 0,
              canvasAttached: Boolean(canvas.isConnected),
            });
          }

          const size = await renderPdfReaderPage({
            doc,
            pageNumber,
            scale: scaleToRender,
            canvas,
            textLayerEl: textLayerRef.current,
          });
          if (cancelled || token !== renderTokenRef.current) return;
          if (process.env.NODE_ENV === "development") {
            console.info("[pdf-reader] render done", {
              w: size.width,
              h: size.height,
              canvasW: canvas.width,
              canvasH: canvas.height,
              hasInk: canvasHasVisibleInk(canvas),
            });
          }
          setRenderedZoom(scaleToRender);
          setPageDisplaySize({ w: size.width, h: size.height });
          setPageRenderError("");
          setRendering(false);
        } catch (e) {
          if (cancelled || token !== renderTokenRef.current) return;
          const canvasNode = canvasRef.current;
          if (canvasNode && canvasNode.width > 1 && canvasNode.height > 1 && canvasHasVisibleInk(canvasNode)) {
            setPageDisplaySize({
              w: Number.parseFloat(canvasNode.style.width) || canvasNode.width,
              h: Number.parseFloat(canvasNode.style.height) || canvasNode.height,
            });
            setRenderedZoom(zoomRef.current);
            setPageRenderError("");
            setRendering(false);
            return;
          }
          const parsed = classifyPdfError(e);
          setPageRenderError(parsed.message);
          setRendering(false);
        }
      })();
    };

    const tryStart = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (canvas) {
        runRender(canvas);
        return;
      }
      let attempts = 0;
      const poll = () => {
        if (cancelled) return;
        const node = canvasRef.current;
        if (node) {
          runRender(node);
          return;
        }
        attempts += 1;
        if (attempts < CANVAS_ATTACH_MAX_FRAMES) {
          rafHandle = requestAnimationFrame(poll);
        } else {
          setPageRenderError("Could not attach to the page canvas.");
          finishRendering();
        }
      };
      rafHandle = requestAnimationFrame(poll);
    };

    timer = window.setTimeout(tryStart, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (rafHandle) cancelAnimationFrame(rafHandle);
      finishRendering();
    };
  }, [file, pageNumber, zoom, renderNonce]);

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
  const showEncryptedUnlock = Boolean(fileBytes && runError?.kind === "encrypted" && !showWorkspace);
  const thumbLoadingLabel = ws.wsCommon("loadingPreview") || ws.processing;
  const thumbFailedLabel = tCommon.has("previewFailed")
    ? tCommon("previewFailed")
    : ws.wsUi("renderFailed");
  const retryPageRender = useCallback(() => {
    setPageRenderError("");
    setRenderNonce((n) => n + 1);
  }, []);
  const enterFullscreenLabel = ws.wsUi("enterFullscreen");
  const exitFullscreenLabel = ws.wsUi("exitFullscreen");
  const zoomOutLabel = ws.wsUi("zoomOut");
  const zoomInLabel = ws.wsUi("zoomIn");
  const setZoomClamped = useCallback((next: number) => {
    setZoom(clampZoom(next));
  }, []);

  const visualRatio =
    renderedZoom > 0 ? Math.min(ZOOM_MAX / ZOOM_MIN, Math.max(ZOOM_MIN / ZOOM_MAX, zoom / renderedZoom)) : 1;
  const layoutW = pageDisplaySize.w > 0 ? pageDisplaySize.w * visualRatio : undefined;
  const layoutH = pageDisplaySize.h > 0 ? pageDisplaySize.h * visualRatio : undefined;


  const onRestoreProject = useCallback(
    (payload: { files: File[] }) => {
      const next = payload.files[0];
      if (!next) return;
      void pickFile(next);
    },
    [pickFile],
  );

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  const dropTitle = tPage.has("dropTitle") ? tPage("dropTitle") : "Drop your PDF here";
  const selectPdfFile = tPage.has("selectPdfFile") ? tPage("selectPdfFile") : "Select PDF File";
  const privacyLocal = tPage.has("privacyLocal")
    ? tPage("privacyLocal")
    : "Local only — nothing is uploaded";

  return (
    <div id="tool-workspace" className="pdf-reader-tool-page tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={showWorkspace || showEncryptedUnlock}>
        {showEncryptedUnlock ? (
          <div
            id={WORKSPACE_OPERATIONS_ID}
            className="pdf-reader-unlock space-y-3 rounded-none border border-neutral-300 bg-white p-4 md:p-5 dark:border-neutral-800 dark:bg-neutral-900"
          >
            {file?.name ? (
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{file.name}</p>
            ) : null}
            <p className="text-sm text-neutral-600 dark:text-neutral-400" role="alert">
              {runError?.message || ws.wsUi("passwordLabel")}
            </p>
            <label className="pdf-reader-unlock__label" htmlFor={`${baseId}-pdf-password`}>
              {ws.wsUi("passwordLabel")}
            </label>
            <div className="pdf-reader-unlock__row">
              <input
                id={`${baseId}-pdf-password`}
                type="password"
                className="pdf-reader-unlock__input"
                autoComplete="current-password"
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void unlockWithPassword();
                }}
              />
              <button
                type="button"
                className="pdf-reader-unlock__btn"
                disabled={busy || !password.trim()}
                onClick={() => void unlockWithPassword()}
              >
                {ws.wsUi("unlockPreview")}
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>
        ) : !showWorkspace ? (
          <FileUploadZone
            operation={tool.operation}
            slug={slug}
            drag={drag}
            role="button"
            tabIndex={0}
            aria-controls={`${baseId}-input`}
            aria-label={selectPdfFile}
            className="pdf-reader-dropzone cursor-pointer"
            dropTitle={dropTitle}
            selectLabel={selectPdfFile}
            privacyLabel={privacyLocal}
            supportedFormats={["PDF"]}
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
        ) : (
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
              <PdfReaderZoomSlider
                zoom={zoom}
                disabled={busy}
                zoomInLabel={zoomInLabel}
                zoomOutLabel={zoomOutLabel}
                onZoomChange={setZoomClamped}
              />
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
            className={clsx(
              "pdf-reader-layout",
              docFullscreen && "pdf-reader-layout--fullscreen",
            )}
          >
            {showWorkspace && !docFullscreen && fileBytes ? (
              <aside className="pdf-reader-thumbs" aria-label={ws.wsUi("thumbnailsLabel")}>
                <ol className="pdf-reader-thumbs__list" role="list">
                  {Array.from({ length: pageCount }, (_, pageIndex) => {
                    const num = pageIndex + 1;
                    return (
                      <PdfReaderSidebarThumb
                        key={num}
                        pageIndex={pageIndex}
                        pageNumber={num}
                        active={pageNumber === num}
                        fileBytes={fileBytes}
                        password={password}
                        loadingLabel={thumbLoadingLabel}
                        failedLabel={thumbFailedLabel}
                        pageLabel={ws.wsUi("jumpToPage") + ` ${num}`}
                        onSelect={() => setPageNumber(num)}
                      />
                    );
                  })}
                </ol>
              </aside>
            ) : null}

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
                  <PdfReaderZoomSlider
                    zoom={zoom}
                    disabled={busy}
                    zoomInLabel={zoomInLabel}
                    zoomOutLabel={zoomOutLabel}
                    onZoomChange={setZoomClamped}
                  />
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
            <div className="pdf-reader-viewport__stage">
              <div
                className="pdf-reader-viewport__fit"
                style={
                  layoutW && layoutH
                    ? {
                        width: layoutW,
                        height: layoutH,
                      }
                    : undefined
                }
              >
                <div
                  ref={pageRef}
                  className="pdf-reader-page"
                  style={
                    visualRatio !== 1
                      ? {
                          transform: `scale(${visualRatio})`,
                          transformOrigin: "top left",
                          willChange: "transform",
                        }
                      : undefined
                  }
                >
                  <canvas ref={canvasRef} className="pdf-reader-page__canvas" />
                  <div ref={textLayerRef} className="textLayer pdf-reader-page__text" />
                </div>
              </div>
            </div>
            {rendering ? (
              <div className="pdf-reader-viewport__loading" aria-live="polite">
                {ws.wsCommon("loadingPreview") || ws.processing}
              </div>
            ) : null}
            {pageRenderError ? (
              <div className="pdf-reader-viewport__error" role="alert">
                <p className="pdf-reader-viewport__error-title">{ws.wsUi("renderFailed")}</p>
                <p className="pdf-reader-viewport__error-detail">{pageRenderError}</p>
                <button
                  type="button"
                  className="pdf-reader-viewport__error-retry"
                  disabled={busy}
                  onClick={retryPageRender}
                >
                  {ws.wsUi("retryRender")}
                </button>
              </div>
            ) : null}
            {docFullscreen ? (
              <p className="pdf-reader-viewport__fs-hint" aria-hidden>
                Esc · ← →
              </p>
            ) : null}
          </div>
          </div>

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
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
        )}
      </WorkspaceUploadShell>

      <div className="tool-workspace-feedback space-y-3">
        {runError && runError.kind !== "encrypted" ? (
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
        ) : status && !showEncryptedUnlock ? (
          <p className="text-sm text-neutral-700 dark:text-neutral-300" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}

        {!showWorkspace && !showEncryptedUnlock && busy ? (
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
