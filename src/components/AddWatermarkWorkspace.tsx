"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
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
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
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
}: {
  fileBytes: Uint8Array;
  options: WatermarkOptions;
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
    <div
      ref={wrapRef}
      className="relative mx-auto max-w-full overflow-hidden rounded-xl border border-white/10 bg-surface/30"
    >
      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-ink-muted">
          Loading preview…
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
  );
}

export function AddWatermarkWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
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
      setStatus("Please choose a PDF file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another PDF.");
      return;
    }
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus("Reading PDF…");
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const count = await loadPdfPageCount(bytes);
      setFile(next);
      setFileBytes(bytes);
      setPageCount(count);
      setStatus(`${next.name} ready — tune the watermark, then apply.`);
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
      setStatus("Enter watermark text before applying.");
      return;
    }
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Stamping watermark on every page…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const bytes = await addWatermarkBytes(file, options);
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        addWatermarkOutputName(file),
      );
      setDone(true);
      setStatus("Watermark applied. Your download should start automatically.");
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
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Watermarking runs entirely in your browser. Your PDF never leaves your
        device.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Add custom text watermarks to every page with a live preview."
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

      {showWorkspace && fileBytes ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {pageCount} page{pageCount === 1 ? "" : "s"} · preview shows page 1
              </p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4 rounded-xl border border-white/10 bg-surface/40 p-4">
              <h2 className="text-sm font-semibold text-ink">Watermark settings</h2>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">Text</span>
                <input
                  type="text"
                  value={options.text}
                  onChange={(e) => patchOptions({ text: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-ink"
                  placeholder="CONFIDENTIAL"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  Opacity ({Math.round(options.opacity * 100)}%)
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
                  <span className="text-xs font-medium text-ink-muted">Color</span>
                  <input
                    type="color"
                    value={options.colorHex}
                    onChange={(e) => patchOptions({ colorHex: e.target.value })}
                    className="h-10 w-full cursor-pointer rounded-lg border border-white/15 bg-surface"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">Font size ({options.fontSize}px)</span>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={options.fontSize}
                    onChange={(e) => patchOptions({ fontSize: Number(e.target.value) || 42 })}
                    className="w-full rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  Rotation ({options.rotation}°)
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
                <legend className="text-xs font-medium text-ink-muted">Position</legend>
                <div className="grid grid-cols-3 gap-2">
                  {WATERMARK_POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => patchOptions({ position: pos.value as WatermarkPosition })}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        options.position === pos.value
                          ? "border-brand bg-brand/15 text-brand"
                          : "border-white/10 text-ink-muted hover:border-white/20"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">Live preview</h2>
              <WatermarkPreview fileBytes={fileBytes} options={options} />
            </div>
          </div>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Processing…</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-brand to-brand-deep" />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onApply()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply watermark & download
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOptions(DEFAULT_WATERMARK_OPTIONS)}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Reset settings
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Choose another file
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
            setStatus(file ? "Try again or choose another file." : "");
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
        label={showWorkspace ? "Apply watermark" : "Add watermark"}
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
