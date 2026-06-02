"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { clampCropRect, type NormalizedCropRect } from "@/lib/crop-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  applyPaperMarginBytes,
  DEFAULT_MARGINS_MM,
  DEFAULT_SOURCE_CROP,
  marginFractions,
  marginsToPt,
  paperMarginOutputName,
  resolveTargetPaper,
  TARGET_PAPER_PRESETS,
  type CustomPaperUnit,
  type MarginInsets,
  type MarginUnit,
  type PaperMarginOptions,
  type TargetPaperPreset,
} from "@/lib/pdf-paper-margin";
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
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
  type PointerEvent as ReactPointerEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

type MarginHandle = "top" | "right" | "bottom" | "left";

const PT_PER_MM = 72 / 25.4;

function LivePaperPreview({
  fileBytes,
  paperAspect,
  fractions,
  sourceCrop,
}: {
  fileBytes: Uint8Array;
  paperAspect: number;
  fractions: { top: number; right: number; bottom: number; left: number };
  sourceCrop: NormalizedCropRect;
}) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, 0, undefined, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes]);

  const contentStyle = {
    left: `${fractions.left * 100}%`,
    top: `${fractions.top * 100}%`,
    right: `${fractions.right * 100}%`,
    bottom: `${fractions.bottom * 100}%`,
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted">
        Outer frame = selected paper · dashed box = printable area after margins · dimmed region is
        trimmed from the source PDF
      </p>
      <div
        className="relative mx-auto w-full max-w-lg overflow-hidden rounded-xl border-2 border-slate-400/50 bg-white shadow-inner dark:border-slate-500 dark:bg-slate-100"
        style={{ aspectRatio: `${paperAspect}` }}
      >
        {loading ? (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-500">
            Loading preview…
          </div>
        ) : null}
        {!loading && canvasEl ? (
          <div className="absolute inset-0" style={contentStyle}>
            <div className="relative h-full w-full overflow-hidden bg-slate-50">
              <canvas
                ref={(node) => {
                  if (node && canvasEl) {
                    node.width = canvasEl.width;
                    node.height = canvasEl.height;
                    const ctx = node.getContext("2d");
                    if (ctx) {
                      ctx.clearRect(0, 0, node.width, node.height);
                      const sx = sourceCrop.nx * canvasEl.width;
                      const sy = sourceCrop.ny * canvasEl.height;
                      const sw = sourceCrop.nw * canvasEl.width;
                      const sh = sourceCrop.nh * canvasEl.height;
                      ctx.drawImage(canvasEl, sx, sy, sw, sh, 0, 0, node.width, node.height);
                    }
                  }
                }}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute border-2 border-dashed border-emerald-500/90"
          style={contentStyle}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-slate-400/40" aria-hidden />
      </div>
    </div>
  );
}

function MarginDragStudio({
  paper,
  margins,
  marginUnit,
  onMarginsChange,
}: {
  paper: { widthPt: number; heightPt: number };
  margins: MarginInsets;
  marginUnit: MarginUnit;
  onMarginsChange: (m: MarginInsets) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: MarginHandle; start: MarginInsets } | null>(null);
  const fractions = marginFractions(paper, marginsToPt(margins, marginUnit));
  const aspect = paper.widthPt / paper.heightPt;

  const paperW = marginUnit === "in" ? paper.widthPt / 72 : paper.widthPt / PT_PER_MM;
  const paperH = marginUnit === "in" ? paper.heightPt / 72 : paper.heightPt / PT_PER_MM;

  const pointerToMargins = (handle: MarginHandle, px: number, py: number, w: number, h: number): MarginInsets => {
    const x = px / w;
    const y = py / h;
    const next = { ...margins };
    if (handle === "left") {
      next.left = Math.max(0, Math.min(paperW * 0.45, x * paperW));
    }
    if (handle === "right") {
      next.right = Math.max(0, Math.min(paperW * 0.45, (1 - x) * paperW));
    }
    if (handle === "top") {
      next.top = Math.max(0, Math.min(paperH * 0.45, y * paperH));
    }
    if (handle === "bottom") {
      next.bottom = Math.max(0, Math.min(paperH * 0.45, (1 - y) * paperH));
    }
    return next;
  };

  const onPointerDown = (handle: MarginHandle) => (e: ReactPointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { handle, start: margins };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const mode = dragRef.current;
    const el = wrapRef.current;
    if (!mode || !el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    onMarginsChange(pointerToMargins(mode.handle, px, py, rect.width, rect.height));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const contentStyle = {
    left: `${fractions.left * 100}%`,
    top: `${fractions.top * 100}%`,
    right: `${fractions.right * 100}%`,
    bottom: `${fractions.bottom * 100}%`,
  };

  const handleAt = (handle: MarginHandle): React.CSSProperties => {
    if (handle === "top")
      return {
        left: `calc(50% - 8px)`,
        top: `calc(${fractions.top * 100}% - 8px)`,
        cursor: "ns-resize",
      };
    if (handle === "bottom")
      return {
        left: `calc(50% - 8px)`,
        top: `calc(${(1 - fractions.bottom) * 100}% - 8px)`,
        cursor: "ns-resize",
      };
    if (handle === "left")
      return {
        left: `calc(${fractions.left * 100}% - 8px)`,
        top: `calc(50% - 8px)`,
        cursor: "ew-resize",
      };
    return {
      left: `calc(${(1 - fractions.right) * 100}% - 8px)`,
      top: `calc(50% - 8px)`,
      cursor: "ew-resize",
    };
  };

  return (
    <PdfEditStudio>
      <PdfStudioPage className="mx-auto max-w-md">
        <p className="mb-2 text-xs text-ink-muted">Drag handles to adjust margins on the paper frame.</p>
        <div
          ref={wrapRef}
          className="relative touch-none select-none overflow-hidden rounded-lg border border-white/20 bg-white"
          style={{ aspectRatio: `${aspect}` }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div className="absolute inset-0 bg-slate-200/80" />
          <div className="absolute inset-0 bg-white" style={contentStyle} />
          <div
            className="pointer-events-none absolute border-2 border-dashed border-emerald-600"
            style={contentStyle}
          />
          {(["top", "right", "bottom", "left"] as MarginHandle[]).map((h) => (
            <span
              key={h}
              role="slider"
              aria-label={`${h} margin`}
              className="absolute z-10 h-4 w-4 rounded-full border-2 border-emerald-600 bg-white shadow"
              style={handleAt(h)}
              onPointerDown={onPointerDown(h)}
            />
          ))}
        </div>
      </PdfStudioPage>
    </PdfEditStudio>
  );
}

export function CustomPaperMarginWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [paperPreset, setPaperPreset] = useState<TargetPaperPreset | "custom">("a4");
  const [customWidth, setCustomWidth] = useState("210");
  const [customHeight, setCustomHeight] = useState("297");
  const [customUnit, setCustomUnit] = useState<CustomPaperUnit>("mm");
  const [margins, setMargins] = useState<MarginInsets>(DEFAULT_MARGINS_MM);
  const [marginUnit, setMarginUnit] = useState<MarginUnit>("mm");
  const [sourceCrop, setSourceCrop] = useState<NormalizedCropRect>(DEFAULT_SOURCE_CROP);
  const [linkMargins, setLinkMargins] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  const paper = useMemo(
    () =>
      resolveTargetPaper({
        paperPreset,
        customWidth: Number(customWidth),
        customHeight: Number(customHeight),
        customUnit,
      }),
    [paperPreset, customWidth, customHeight, customUnit],
  );

  const fractions = useMemo(
    () => marginFractions(paper, marginsToPt(margins, marginUnit)),
    [paper, margins, marginUnit],
  );

  const options: PaperMarginOptions = useMemo(
    () => ({
      paperPreset,
      customWidth: Number(customWidth),
      customHeight: Number(customHeight),
      customUnit,
      margins,
      marginUnit,
      sourceCrop,
    }),
    [paperPreset, customWidth, customHeight, customUnit, margins, marginUnit, sourceCrop],
  );

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setMargins(DEFAULT_MARGINS_MM);
    setSourceCrop(DEFAULT_SOURCE_CROP);
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
    setBusy(true);
    setRunError(null);
    setDone(false);
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const count = await loadPdfPageCount(bytes);
      setFile(next);
      setFileBytes(bytes);
      setPageCount(count);
      setStatus(`${next.name} ready — set paper size and margins, then apply to all ${count} page(s).`);
      capture(EVENTS.file_selected, { operation: tool.operation, count });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setFile(null);
      setFileBytes(null);
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const setMarginField = (key: keyof MarginInsets, value: number) => {
    if (linkMargins) {
      setMargins({ top: value, right: value, bottom: value, left: value });
    } else {
      setMargins((m) => ({ ...m, [key]: value }));
    }
  };

  const applyPaper = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus("Resizing and applying margins locally…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
    try {
      const out = await applyPaperMarginBytes(file, options);
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), paperMarginOutputName(file));
      setDone(true);
      setStatus(`Downloaded ${pageCount} page(s) on ${paper.label} with your margins.`);
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "pdf" });
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

  const canApply = Boolean(file && fileBytes && !busy);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>Your PDF never leaves your browser.</strong> Cropping, scaling, and page resizing use
        pdf-lib locally—no upload to JoinMyPDF.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop a PDF to resize to custom paper with margins"
        description="Fit content to A5, B5, Letter, or custom sizes with precise margins."
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
          const f = e.dataTransfer.files?.[0];
          if (f) void pickFile(f);
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
              const f = e.target.files?.[0];
              if (f) void pickFile(f);
              e.target.value = "";
            }}
          />
        }
      />

      {file && fileBytes ? (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <section className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-ink">
              <span className="mb-1 block font-semibold">Target paper</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                value={paperPreset}
                onChange={(e) => setPaperPreset(e.target.value as TargetPaperPreset | "custom")}
              >
                {(Object.keys(TARGET_PAPER_PRESETS) as TargetPaperPreset[]).map((key) => (
                  <option key={key} value={key}>
                    {TARGET_PAPER_PRESETS[key].label}
                  </option>
                ))}
                <option value="custom">Custom size…</option>
              </select>
            </label>
            <label className="block text-sm text-ink">
              <span className="mb-1 block font-semibold">Margin units</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                value={marginUnit}
                onChange={(e) => setMarginUnit(e.target.value as MarginUnit)}
              >
                <option value="mm">Millimeters</option>
                <option value="in">Inches</option>
              </select>
            </label>
            {paperPreset === "custom" ? (
              <>
                <label className="block text-sm text-ink">
                  <span className="mb-1 block font-semibold">Width</span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                  />
                </label>
                <label className="block text-sm text-ink">
                  <span className="mb-1 block font-semibold">Height</span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                  />
                </label>
                <label className="block text-sm text-ink md:col-span-2">
                  <span className="mb-1 block font-semibold">Custom units</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as CustomPaperUnit)}
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </label>
              </>
            ) : null}
          </section>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={linkMargins}
              onChange={(e) => setLinkMargins(e.target.checked)}
            />
            Same margin on all sides
          </label>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <label key={side} className="block text-sm text-ink">
                <span className="mb-1 block capitalize">{side}</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                  value={margins[side]}
                  onChange={(e) => setMarginField(side, Number(e.target.value) || 0)}
                />
              </label>
            ))}
          </div>

          <section aria-labelledby={`${baseId}-trim`}>
            <h2 id={`${baseId}-trim`} className="mb-2 text-sm font-semibold text-ink">
              Trim source edges (optional)
            </h2>
            <p className="mb-3 text-xs text-ink-muted">
              Adjust crop fractions (0–1). Use{" "}
              <a className="text-brand hover:underline" href="/tools/crop-pdf/">
                Crop PDF
              </a>{" "}
              for a visual crop editor on complex files.
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {(["nx", "ny", "nw", "nh"] as const).map((key) => (
                <label key={key} className="text-xs text-ink">
                  {key}
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    className="mt-1 w-full rounded border border-white/15 bg-surface/60 px-2 py-1"
                    value={sourceCrop[key]}
                    onChange={(e) =>
                      setSourceCrop((c) => clampCropRect({ ...c, [key]: Number(e.target.value) || 0 }))
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section aria-labelledby={`${baseId}-live`}>
            <h2 id={`${baseId}-live`} className="mb-3 text-sm font-semibold text-ink">
              Live preview — page 1
            </h2>
            <LivePaperPreview
              fileBytes={fileBytes}
              paperAspect={paper.widthPt / paper.heightPt}
              fractions={fractions}
              sourceCrop={sourceCrop}
            />
          </section>

          <MarginDragStudio
            paper={paper}
            margins={margins}
            marginUnit={marginUnit}
            onMarginsChange={setMargins}
          />

          <div className="flex flex-wrap gap-3">
            <button type="button" className={toolPrimaryBtn} disabled={!canApply} onClick={() => void applyPaper()}>
              {busy ? "Applying…" : "Apply to all pages"}
            </button>
            <button type="button" className={toolSecondaryBtn} onClick={reset}>
              Clear
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
          onDismiss={() => setRunError(null)}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label="Apply margins"
        secondaryHref="/tools/pdf-to-booklet/"
        secondaryLabel="Booklet"
      />
    </div>
  );
}
