"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  addWatermarkBytes,
  addWatermarkOutputName,
  DEFAULT_WATERMARK_OPTIONS,
  estimateTextWidth,
  WATERMARK_POSITIONS,
  watermarkPreviewAnchor,
  type WatermarkOptions,
  type WatermarkPosition,
} from "@/lib/add-watermark";
import { watermarkPositionLabel } from "@/lib/workspace-preset-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
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

function WatermarkPreview({
  fileBytes,
  options,
  loadingLabel,
}: {
  fileBytes: Uint8Array;
  options: WatermarkOptions;
  loadingLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, 0, undefined, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setBaseCanvas(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const base = baseCanvas;
    if (!overlay || !base) return;
    overlay.width = base.width;
    overlay.height = base.height;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const text = options.text.trim() || " ";
    const textWidth = estimateTextWidth(text, options.fontSize);
    const { x, y } = watermarkPreviewAnchor(
      overlay.width,
      overlay.height,
      options.position,
      textWidth,
      options.fontSize,
    );
    ctx.save();
    ctx.globalAlpha = options.opacity;
    ctx.fillStyle = options.colorHex;
    ctx.font = `bold ${options.fontSize}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(x, y);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }, [baseCanvas, options]);

  return (
    <PdfEditStudio minHeight={loading ? "min-h-[320px]" : undefined}>
      <PdfStudioPage className="mx-auto max-w-full">
        <div ref={wrapRef} className="relative overflow-hidden">
      {loading ? (
        <div className="flex min-h-[280px] min-w-[200px] items-center justify-center text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
          {loadingLabel}
        </div>
      ) : null}
      {baseCanvas ? (
        <>
          <canvas
            ref={(node) => {
              if (node && baseCanvas) {
                node.width = baseCanvas.width;
                node.height = baseCanvas.height;
                const ctx = node.getContext("2d");
                if (ctx) ctx.drawImage(baseCanvas, 0, 0);
              }
            }}
            className="block h-auto max-w-full"
          />
          <canvas
            ref={overlayRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
            aria-hidden
          />
        </>
      ) : null}
        </div>
      </PdfStudioPage>
    </PdfEditStudio>
  );
}

export function AddWatermarkWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [options, setOptions] = useState<WatermarkOptions>(DEFAULT_WATERMARK_OPTIONS);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setOptions(DEFAULT_WATERMARK_OPTIONS);
    setStatus("");
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
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsCommon("readingPdf"));
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const count = await loadPdfPageCount(bytes);
      setFile(next);
      setFileBytes(bytes);
      setPageCount(count);
      setStatus(ws.wsStatus("fileReady", { name: next.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      setFileBytes(null);
    } finally {
      setBusy(false);
    }
  };

  const patchOptions = (patch: Partial<WatermarkOptions>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  };

  const onApply = async () => {
    if (!file) return;
    if (!options.text.trim()) {
      setStatus(ws.wsStatus("textRequired"));
      return;
    }
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("stamping"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await addWatermarkBytes(file, options);
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        addWatermarkOutputName(file),
      );
      setDone(true);
      setStatus(ws.wsStatus("complete"));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
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
    }
  };

  const showWorkspace = Boolean(file && fileBytes);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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

      {showWorkspace && fileBytes ? (
        <div className="tool-workspace-panel space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {ws.wsUi("pageSummary", { count: pageCount })}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            <div className="space-y-2 rounded-none border border-white/10 bg-surface/40 p-4">
              <h2 className="text-sm font-semibold text-ink">{ws.wsUi("settingsHeading")}</h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">{ws.wsUi("textLabel")}</span>
                <input
                  type="text"
                  value={options.text}
                  onChange={(e) => patchOptions({ text: e.target.value })}
                  className="w-full rounded-none border border-white/15 bg-surface px-3 py-2 text-sm text-ink"
                  placeholder={ws.wsUi("textPlaceholder")}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  {ws.wsUi("opacityLabel")} ({Math.round(options.opacity * 100)}%)
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={options.opacity}
                  onChange={(e) => patchOptions({ opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">{ws.wsUi("colorLabel")}</span>
                  <input
                    type="color"
                    value={options.colorHex}
                    onChange={(e) => patchOptions({ colorHex: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-none border border-white/15 bg-surface"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">{ws.wsUi("fontSizeLabel")} ({options.fontSize}px)</span>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={options.fontSize}
                    onChange={(e) => patchOptions({ fontSize: Number(e.target.value) || 42 })}
                    className="w-full rounded-none border border-white/15 bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  {ws.wsUi("rotationLabel")} ({options.rotation}°)
                </span>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={1}
                  value={options.rotation}
                  onChange={(e) => patchOptions({ rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-ink-muted">{ws.wsUi("positionLabel")}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {WATERMARK_POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => patchOptions({ position: pos.value as WatermarkPosition })}
                      className={`rounded-none border px-2 py-2 text-xs font-medium transition ${ options.position === pos.value ? "border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-neutral-200" : "border-white/10 text-ink-muted hover:border-white/20" }`}
                    >
                      {watermarkPositionLabel(ws, pos.value as WatermarkPosition)}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">{ws.wsUi("previewHeading")}</h2>
              <WatermarkPreview
                fileBytes={fileBytes}
                options={options}
                loadingLabel={ws.wsUi("loadingPreview")}
              />
            </div>
          </div>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{ws.processing}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-none bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-none bg-neutral-700 dark:bg-neutral-300" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onApply()}
              className={toolPrimaryBtn}
            >
              {ws.wsText("applyLabel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOptions(DEFAULT_WATERMARK_OPTIONS)}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("resetSettings")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
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
            setStatus(file ? ws.wsStatus("tryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={showWorkspace ? ws.wsText("stickyApplyLabel") : ws.wsText("stickyApplyLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
