"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  BOOKLET_PAPER_PRESETS,
  bookletOutputName,
  buildSaddleStitchPlan,
  createBookletPdf,
  duplexFlipHint,
  resolveBookletPaperSize,
  type BookletDuplexFlip,
  type BookletFoldStyle,
  type BookletOptions,
  type BookletPaperPreset,
  type BookletPlan,
  type BookletSheetSide,
  type CustomPaperUnit,
} from "@/lib/pdf-booklet";
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

type Thumb = { pageIndex: number; dataUrl: string };

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function renderThumbnails(data: Uint8Array): Promise<Thumb[]> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({ data: data.slice() }).promise;
  const thumbs: Thumb[] = [];
  const scale = 0.22;
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
    thumbs.push({ pageIndex: i - 1, dataUrl: canvas.toDataURL("image/jpeg", 0.88) });
  }
  return thumbs;
}

function pageLabel(n: number | null, sourceCount: number): string {
  if (!n) return "—";
  if (n > sourceCount) return "Blank";
  return String(n);
}

function BookletSheetPreview({
  side,
  plan,
  thumbs,
  paperLabel,
}: {
  side: BookletSheetSide;
  plan: BookletPlan;
  thumbs: Thumb[];
  paperLabel: string;
}) {
  const thumbFor = (oneBased: number | null) => {
    if (!oneBased || oneBased < 1 || oneBased > plan.sourcePageCount) return null;
    return thumbs.find((t) => t.pageIndex === oneBased - 1)?.dataUrl ?? null;
  };

  const leftUrl = thumbFor(side.leftPage);
  const rightUrl = thumbFor(side.rightPage);

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Sheet {side.sheetIndex} · {side.side === "front" ? "Front (outside)" : "Back (inside)"} ·{" "}
        {paperLabel}
      </p>
      <div className="relative grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-white/15 bg-slate-950/50 shadow-inner">
        <div className="relative border-r border-dashed border-white/20 p-2">
          <SlotPreview url={leftUrl} label={pageLabel(side.leftPage, plan.sourcePageCount)} align="left" />
        </div>
        <div className="relative p-2">
          <SlotPreview url={rightUrl} label={pageLabel(side.rightPage, plan.sourcePageCount)} align="right" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-4 left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed border-amber-400/70"
          aria-hidden
          title="Fold line"
        />
        <span className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
          Fold
        </span>
      </div>
      <p className="text-xs text-ink-muted">
        After duplex printing and folding, these spreads nest into reading order. Blank slots are
        padding so page count is a multiple of four.
      </p>
    </div>
  );
}

function SlotPreview({
  url,
  label,
  align,
}: {
  url: string | null;
  label: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-h-[140px] flex-col gap-2 ${align === "right" ? "items-end text-right" : "items-start"}`}
    >
      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-ink">
        Page {label}
      </span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Preview page ${label}`} className="max-h-44 w-full rounded object-contain" />
      ) : (
        <div className="flex min-h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-xs text-ink-muted">
          {label === "Blank" ? "Blank padding" : "Empty slot"}
        </div>
      )}
    </div>
  );
}

export function BookletPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [paperPreset, setPaperPreset] = useState<BookletPaperPreset | "custom">("letter");
  const [customWidth, setCustomWidth] = useState("8.5");
  const [customHeight, setCustomHeight] = useState("11");
  const [customUnit, setCustomUnit] = useState<CustomPaperUnit>("in");
  const [foldStyle, setFoldStyle] = useState<BookletFoldStyle>("saddle-stitch");
  const [duplexFlip, setDuplexFlip] = useState<BookletDuplexFlip>("long-edge");
  const [previewSideIndex, setPreviewSideIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  const options: BookletOptions = useMemo(
    () => ({
      paperPreset,
      customWidth: Number(customWidth),
      customHeight: Number(customHeight),
      customUnit,
      foldStyle,
      duplexFlip,
    }),
    [paperPreset, customWidth, customHeight, customUnit, foldStyle, duplexFlip],
  );

  const paper = useMemo(() => resolveBookletPaperSize(options), [options]);
  const plan = useMemo(
    () => (thumbs.length ? buildSaddleStitchPlan(thumbs.length) : null),
    [thumbs.length],
  );

  const previewSide = plan?.sides[previewSideIndex] ?? null;

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    if (plan && previewSideIndex >= plan.sides.length) {
      setPreviewSideIndex(0);
    }
  }, [plan, previewSideIndex]);

  const reset = useCallback(() => {
    setFile(null);
    setThumbs([]);
    setPreviewSideIndex(0);
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
    setDone(false);
    setRunError(null);
    setStatus("Loading page previews…");
    setLoadingThumbs(true);
    const bytes = new Uint8Array(await next.arrayBuffer());
    try {
      const rendered = await renderThumbnails(bytes);
      setFile(next);
      setThumbs(rendered);
      setPreviewSideIndex(0);
      const nextPlan = buildSaddleStitchPlan(rendered.length);
      setStatus(
        `${rendered.length} page(s) → ${nextPlan.sheetCount} physical sheet(s), ${nextPlan.sides.length} print sides. ` +
          (nextPlan.blankPadCount
            ? `${nextPlan.blankPadCount} blank page(s) will be added for correct folding.`
            : "Ready for saddle-stitch imposition."),
      );
      capture(EVENTS.file_selected, { operation: tool.operation, pages: rendered.length });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    } finally {
      setLoadingThumbs(false);
    }
  };

  const buildBooklet = async () => {
    if (!file || busy) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Creating imposed booklet PDF locally…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const { bytes: out, plan: built } = await createBookletPdf(file, options);
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), bookletOutputName(file));
      setDone(true);
      setStatus(
        `Downloaded booklet PDF with ${built.sides.length} print sides (${built.sheetCount} sheet(s)). ` +
          duplexFlipHint(duplexFlip),
      );
      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        sheets: built.sheetCount,
      });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "pdf" });
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

  const canBuild = Boolean(file && plan && !busy && !loadingThumbs);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>Your file never leaves your browser.</strong> Imposition runs locally with pdf-lib—no
        upload to JoinMyPDF servers.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop a PDF to impose as a booklet"
        description="Works best when page count is a multiple of four; we pad with blanks if needed."
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

      {file ? (
        <button type="button" className={toolSecondaryBtn} onClick={reset}>
          Clear file
        </button>
      ) : null}

      {plan ? (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <section className="grid gap-4 md:grid-cols-2" aria-labelledby={`${baseId}-paper`}>
            <h2 id={`${baseId}-paper`} className="sr-only">
              Booklet settings
            </h2>
            <label className="block text-sm text-ink">
              <span className="mb-1 block font-semibold">Paper size</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                value={paperPreset}
                onChange={(e) => setPaperPreset(e.target.value as BookletPaperPreset | "custom")}
              >
                {(Object.keys(BOOKLET_PAPER_PRESETS) as BookletPaperPreset[]).map((key) => (
                  <option key={key} value={key}>
                    {BOOKLET_PAPER_PRESETS[key].label}
                  </option>
                ))}
                <option value="custom">Custom size…</option>
              </select>
            </label>
            <label className="block text-sm text-ink">
              <span className="mb-1 block font-semibold">Fold style</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                value={foldStyle}
                onChange={(e) => setFoldStyle(e.target.value as BookletFoldStyle)}
              >
                <option value="saddle-stitch">Saddle-stitch booklet (standard)</option>
              </select>
            </label>
            {paperPreset === "custom" ? (
              <>
                <label className="block text-sm text-ink">
                  <span className="mb-1 block font-semibold">Width</span>
                  <input
                    type="number"
                    min={1}
                    step={0.1}
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
                    step={0.1}
                    className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                  />
                </label>
                <label className="block text-sm text-ink md:col-span-2">
                  <span className="mb-1 block font-semibold">Units</span>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as CustomPaperUnit)}
                  >
                    <option value="in">Inches</option>
                    <option value="cm">Centimeters</option>
                    <option value="mm">Millimeters</option>
                  </select>
                </label>
              </>
            ) : null}
            <label className="block text-sm text-ink md:col-span-2">
              <span className="mb-1 block font-semibold">Duplex printing</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-surface/60 px-3 py-2"
                value={duplexFlip}
                onChange={(e) => setDuplexFlip(e.target.value as BookletDuplexFlip)}
              >
                <option value="long-edge">Flip on long edge (portrait booklets)</option>
                <option value="short-edge">Flip on short edge (landscape)</option>
              </select>
              <span className="mt-1 block text-xs text-ink-muted">{duplexFlipHint(duplexFlip)}</span>
            </label>
          </section>

          <p className="text-sm text-ink-muted">
            Output paper: <strong className="text-ink">{paper.label}</strong> · {plan.sheetCount}{" "}
            sheet(s) · {plan.sides.length} sides to print
          </p>

          <section aria-labelledby={`${baseId}-preview`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id={`${baseId}-preview`} className="text-sm font-semibold text-ink">
                Live sheet preview
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={toolSecondaryBtn}
                  disabled={previewSideIndex <= 0}
                  onClick={() => setPreviewSideIndex((i) => Math.max(0, i - 1))}
                >
                  Previous side
                </button>
                <button
                  type="button"
                  className={toolSecondaryBtn}
                  disabled={!plan || previewSideIndex >= plan.sides.length - 1}
                  onClick={() => setPreviewSideIndex((i) => Math.min(plan.sides.length - 1, i + 1))}
                >
                  Next side
                </button>
                <select
                  className="rounded-lg border border-white/15 bg-surface/60 px-3 py-2 text-sm text-ink"
                  value={previewSideIndex}
                  onChange={(e) => setPreviewSideIndex(Number(e.target.value))}
                  aria-label="Jump to print side"
                >
                  {plan.sides.map((s, i) => (
                    <option key={i} value={i}>
                      Sheet {s.sheetIndex} {s.side} — {pageLabel(s.leftPage, plan.sourcePageCount)} |{" "}
                      {pageLabel(s.rightPage, plan.sourcePageCount)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {previewSide ? (
              <BookletSheetPreview
                side={previewSide}
                plan={plan}
                thumbs={thumbs}
                paperLabel={paper.label}
              />
            ) : null}
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={toolPrimaryBtn} disabled={!canBuild} onClick={() => void buildBooklet()}>
              {busy ? "Building booklet…" : "Create booklet PDF"}
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
          {loadingThumbs ? "Generating previews…" : status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label="Create booklet"
        secondaryHref="/tools/crop-pdf/"
        secondaryLabel="Crop PDF"
      />
    </div>
  );
}
