"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import {
  applyPdfTextLayers,
  pdfTextEditorOutputName,
  type PdfTextLayer,
} from "@/lib/pdf-text-editor";
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
  type MouseEvent as ReactMouseEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function TextEditorPreview({
  fileBytes,
  pageIndex,
  password,
  layers,
  draftText,
  fontSize,
  colorHex,
  coverExisting,
  onPlace,
  loadingLabel,
  clickHint,
}: {
  fileBytes: Uint8Array;
  pageIndex: number;
  password: string;
  layers: PdfTextLayer[];
  draftText: string;
  fontSize: number;
  colorHex: string;
  coverExisting: boolean;
  onPlace: (nx: number, ny: number) => void;
  loadingLabel: string;
  clickHint: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, pageIndex, password, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setBaseCanvas(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  useEffect(() => {
    const baseEl = baseRef.current;
    if (!baseEl || !baseCanvas) return;
    baseEl.width = baseCanvas.width;
    baseEl.height = baseCanvas.height;
    const ctx = baseEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, baseEl.width, baseEl.height);
    ctx.drawImage(baseCanvas, 0, 0);
  }, [baseCanvas]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const base = baseCanvas;
    if (!overlay || !base) return;
    overlay.width = base.width;
    overlay.height = base.height;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const drawLayer = (layer: PdfTextLayer, isDraft = false) => {
      if (layer.pageIndex !== pageIndex) return;
      const x = layer.nx * overlay.width;
      const y = layer.ny * overlay.height;
      const size = layer.fontSize * (REDACT_UI_SCALE * 0.85);
      if (layer.coverExisting) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 4, y - 4, Math.max(layer.text.length * size * 0.55, 24) + 8, size + 8);
      }
      ctx.fillStyle = isDraft ? `${layer.colorHex}99` : layer.colorHex;
      ctx.font = `bold ${size}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(layer.text, x, y);
    };

    for (const layer of layers) drawLayer(layer);
    if (draftText.trim()) {
      drawLayer(
        {
          pageIndex,
          nx: 0.35,
          ny: 0.45,
          text: draftText,
          fontSize,
          colorHex,
          coverExisting,
        },
        true,
      );
    }
  }, [baseCanvas, layers, pageIndex, draftText, fontSize, colorHex, coverExisting]);

  const onClick = (event: ReactMouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !draftText.trim()) return;
    onPlace((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  };

  return (
    <PdfEditStudio minHeight="min-h-[280px]">
      <PdfStudioPage className="relative inline-block max-w-full">
        <div
          ref={wrapRef}
          className="relative cursor-crosshair"
          onClick={onClick}
          role="presentation"
          title={clickHint}
        >
          {loading || !baseCanvas ? (
            <div className="flex min-h-[240px] min-w-[200px] items-center justify-center text-sm text-black dark:text-neutral-200">
              {loadingLabel}
            </div>
          ) : (
            <>
              <canvas ref={baseRef} className="block max-h-[420px] max-w-full" />
              <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            </>
          )}
        </div>
      </PdfStudioPage>
    </PdfEditStudio>
  );
}

export function PdfTextEditorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [layers, setLayers] = useState<PdfTextLayer[]>([]);
  const [draftText, setDraftText] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [colorHex, setColorHex] = useState("#000000");
  const [coverExisting, setCoverExisting] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPageIndex(0);
    setPassword("");
    setEncrypted(false);
    setLayers([]);
    setDraftText("");
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
      setLayers([]);
      setPageIndex(0);
      setDone(false);
      setRunError(null);
      setPassword("");

      try {
        setEncrypted(await pdf.isPdfEncrypted(picked));
      } catch {
        setEncrypted(false);
      }

      try {
        const count = await loadPdfPageCount(bytes, "");
        setPageCount(count);
        setStatus(ws.wsStatus("loadedClick", { count }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [tool.operation, ws],
  );

  const placeLayer = (nx: number, ny: number) => {
    const text = draftText.trim();
    if (!text) {
      setStatus(ws.wsStatus("enterText"));
      return;
    }
    setLayers((prev) => [
      ...prev,
      {
        pageIndex,
        nx: Math.max(0, Math.min(nx, 0.98)),
        ny: Math.max(0, Math.min(ny, 0.98)),
        text,
        fontSize,
        colorHex,
        coverExisting,
      },
    ]);
    setStatus(ws.wsStatus("layerAdded", { count: layers.length + 1 }));
  };

  const onApply = async () => {
    if (!file || !fileBytes || busy) return;
    if (!layers.length) {
      setStatus(ws.wsStatus("addLayer"));
      return;
    }
    if (encrypted && !password.trim()) {
      setStatus(ws.wsStatus("enterPassword"));
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await applyPdfTextLayers(fileBytes, layers, { password });
      const outName = pdfTextEditorOutputName(file.name);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
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

  return (
    <div id="tool-workspace" className="tool-workspace--wide space-y-3 pb-12 md:pb-8">
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
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="truncate text-sm text-ink-muted">
                <span className="font-medium text-ink">{file.name}</span> · {pdf.formatBytes(file.size)}
              </p>
              <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
                {ws.chooseAnotherFile}
              </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
            </div>

            {encrypted ? (
              <div className="protect-form">
                <label className="protect-form__label" htmlFor={`${baseId}-password`}>
                  {ws.wsUi("passwordLabel")}
                </label>
                <input
                  id={`${baseId}-password`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="protect-form__input"
                  autoComplete="off"
                />
              </div>
            ) : null}

            <div className="grid gap-3 rounded-none border border-neutral-400/30 bg-neutral-500/[0.06] p-4 ring-1 ring-neutral-400/20 backdrop-blur-md dark:border-neutral-400/40 dark:bg-neutral-500/10">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-semibold text-black dark:text-neutral-200">{ws.wsUi("textLabel")}</span>
                  <input
                    type="text"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder={ws.wsUi("textPlaceholder")}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold text-black dark:text-neutral-200">{ws.wsUi("pageLabel")}</span>
                  <select
                    value={pageIndex}
                    onChange={(e) => setPageIndex(Number(e.target.value))}
                    className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i} value={i}>
                        {ws.wsUi("pageOption", { page: i + 1 })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-semibold text-black dark:text-neutral-200">{ws.wsUi("fontSizeLabel")}</span>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value) || 14)}
                    className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold text-black dark:text-neutral-200">{ws.wsUi("colorLabel")}</span>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="mt-1 h-10 w-full rounded-none border border-neutral-300 bg-white dark:border-neutral-700"
                  />
                </label>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={coverExisting}
                    onChange={(e) => setCoverExisting(e.target.checked)}
                  />
                  <span>{ws.wsUi("coverExistingLabel")}</span>
                </label>
              </div>
            </div>

            {fileBytes ? (
              <TextEditorPreview
                fileBytes={fileBytes}
              pageIndex={pageIndex}
              password={password}
              layers={layers}
              draftText={draftText}
              fontSize={fontSize}
              colorHex={colorHex}
              coverExisting={coverExisting}
              onPlace={placeLayer}
              loadingLabel={ws.wsUi("loadingPreview")}
              clickHint={ws.wsUi("clickToPlace")}
              />
            ) : null}

            {layers.length ? (
              <ul className="space-y-1 text-sm text-black dark:text-neutral-200">
                {layers.map((layer, index) => (
                  <li
                    key={`${layer.pageIndex}-${layer.nx}-${layer.ny}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-none border border-neutral-300 px-3 py-2 dark:border-neutral-700"
                  >
                    <span>
                      {ws.wsUi("layerSummary", {
                        page: layer.pageIndex + 1,
                        text: layer.text.slice(0, 40),
                      })}
                    </span>
                    <button
                      type="button"
                      className={toolSecondaryBtn}
                      onClick={() => setLayers((prev) => prev.filter((_, i) => i !== index))}
                    >
                      {ws.wsUi("removeLayer")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
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
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className={toolPrimaryBtn} disabled={busy} onClick={() => void onApply()}>
                {ws.buttonLabel()}
              </button>
            </div>
          </div>
        ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
      <StickyMobileCta href="#tool-workspace" label={ws.buttonLabel()} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
