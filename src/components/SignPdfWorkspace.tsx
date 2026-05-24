"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { SignatureModal } from "@/components/SignatureModal";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  defaultSignaturePlacement,
  loadPdfPageCount,
  renderPdfPageForUi,
  signPdfOutputName,
  type NormalizedSignaturePlacement,
} from "@/lib/pdf-sign";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import {
  useCallback,
  useEffect,
  useId,
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

type DragMode = { type: "move" | "resize"; startX: number; startY: number; orig: NormalizedSignaturePlacement };

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function SignPageStage({
  pageIndex,
  fileBytes,
  password,
  placement,
  signatureUrl,
  onPlacementChange,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  placement: NormalizedSignaturePlacement | null;
  signatureUrl: string | null;
  onPlacementChange: (next: NormalizedSignaturePlacement) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<DragMode | null>(null);

  const showPlaque = placement && signatureUrl && placement.pageIndex === pageIndex;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, pageIndex, password).then((canvas) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  const pointerInStage = (event: ReactPointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const commitDrag = () => {
    dragRef.current = null;
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage || !placement) return;
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    const p = pointerInStage(event);
    const dx = (p.x - drag.startX) / w;
    const dy = (p.y - drag.startY) / h;
    const o = drag.orig;

    if (drag.type === "move") {
      onPlacementChange({
        ...o,
        nx: clamp01(o.nx + dx),
        ny: clamp01(o.ny + dy),
      });
    } else {
      onPlacementChange({
        ...o,
        nw: clamp01(Math.max(0.08, o.nw + dx)),
        nh: clamp01(Math.max(0.04, o.nh + dy)),
      });
    }
  };

  return (
    <div className="sign-page">
      <p className="sign-page__label">Page {pageIndex + 1}</p>
      <div
        ref={stageRef}
        className="sign-page__stage"
        onPointerMove={onPointerMove}
        onPointerUp={commitDrag}
        onPointerLeave={commitDrag}
      >
        {loading ? (
          <p className="sign-page__loading">Rendering page…</p>
        ) : canvasEl ? (
          <canvas
            className="sign-page__canvas"
            ref={(node) => {
              if (node && canvasEl) {
                node.width = canvasEl.width;
                node.height = canvasEl.height;
                const ctx = node.getContext("2d");
                if (ctx) ctx.drawImage(canvasEl, 0, 0);
              }
            }}
            width={canvasEl.width}
            height={canvasEl.height}
          />
        ) : null}
        {showPlaque ? (
          <div
            className="sign-plaque"
            style={{
              left: `${placement.nx * 100}%`,
              top: `${placement.ny * 100}%`,
              width: `${placement.nw * 100}%`,
              height: `${placement.nh * 100}%`,
            }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              const p = pointerInStage(e);
              dragRef.current = { type: "move", startX: p.x, startY: p.y, orig: placement };
            }}
          >
            <img src={signatureUrl} alt="Your signature" className="sign-plaque__img" draggable={false} />
            <span
              className="sign-plaque__handle"
              aria-label="Resize signature"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                const p = pointerInStage(e);
                dragRef.current = { type: "resize", startX: p.x, startY: p.y, orig: placement };
              }}
            />
          </div>
        ) : null}
      </div>
      {showPlaque ? (
        <p className="sign-page__hint">Drag to move · corner handle to resize</p>
      ) : (
        <p className="sign-page__hint">Select this page below to place your signature here.</p>
      )}
    </div>
  );
}

export function SignPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [signatureBytes, setSignatureBytes] = useState<Uint8Array | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<NormalizedSignaturePlacement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const revokeSignatureUrl = useCallback(() => {
    if (signatureUrl) URL.revokeObjectURL(signatureUrl);
  }, [signatureUrl]);

  const reset = useCallback(() => {
    revokeSignatureUrl();
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPassword("");
    setEncrypted(false);
    setSignatureBytes(null);
    setSignatureUrl(null);
    setPlacement(null);
    setModalOpen(false);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [revokeSignatureUrl]);

  useEffect(() => () => revokeSignatureUrl(), [revokeSignatureUrl]);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus("Choose a valid PDF file.");
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      revokeSignatureUrl();
      setFile(picked);
      setFileBytes(bytes);
      setSignatureBytes(null);
      setSignatureUrl(null);
      setPlacement(null);
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
        setStatus(`Loaded ${count} page(s). Create your signature and place it on the page.`);
      } catch {
        setPageCount(0);
        setStatus("Could not open this PDF. If it is protected, enter the password below.");
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, revokeSignatureUrl, tool.operation],
  );

  const reloadWithPassword = useCallback(async () => {
    if (!fileBytes) return;
    try {
      const count = await loadPdfPageCount(fileBytes, password);
      setPageCount(count);
      setStatus(`Loaded ${count} page(s).`);
      setRunError(null);
    } catch {
      setStatus("Could not open with that password. Check and try again.");
    }
  }, [fileBytes, password]);

  const onSignatureSaved = (bytes: Uint8Array, url: string) => {
    revokeSignatureUrl();
    setSignatureBytes(bytes);
    setSignatureUrl(url);
    setPlacement(defaultSignaturePlacement(0));
    setStatus("Drag and resize your signature on the page, then click Sign & Download PDF.");
  };

  const onSign = async () => {
    if (!file || !fileBytes || busy) return;
    if (!signatureBytes || !placement) {
      setStatus("Create a signature and place it on a page first.");
      return;
    }
    if (encrypted && !password.trim()) {
      setStatus("Enter the PDF password to open this file.");
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Applying signature…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.signPdfFile(file, signatureBytes, placement, password);
      const outName = signPdfOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(`Signed PDF downloaded as ${outName}.`);
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

  const canSign = Boolean(signatureBytes && placement);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure &amp; Confidential:</strong> Your signatures and documents are processed
        entirely in your browser. We never see, store, or upload your private contracts.
      </div>

      {!file ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a PDF here or click to browse"
          description="Upload a contract or form to sign locally in your browser."
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
              className="sr-only"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                if (e.target.files?.length) void addFile(e.target.files);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}

      {file && fileBytes ? (
        <div className="sign-workspace space-y-4">
          {encrypted ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="text-sm font-medium text-ink" htmlFor={`${baseId}-pwd`}>
                PDF password (protected files)
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <input
                  id={`${baseId}-pwd`}
                  type="password"
                  className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-ink"
                  autoComplete="current-password"
                  placeholder="Enter password to preview pages"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="btn btn--ghost" onClick={() => void reloadWithPassword()}>
                  Load pages
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn--primary" onClick={() => setModalOpen(true)}>
              {signatureUrl ? "Change signature" : "Create signature"}
            </button>
            {placement && pageCount > 1 ? (
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <span className="font-medium text-ink">Sign on page</span>
                <select
                  className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-ink"
                  value={placement.pageIndex}
                  onChange={(e) =>
                    setPlacement((prev) =>
                      prev ? { ...prev, pageIndex: Number(e.target.value) } : prev,
                    )
                  }
                >
                  {Array.from({ length: pageCount }, (_, i) => (
                    <option key={i} value={i}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {pageCount > 0 ? (
            <div className="sign-pages">
              {Array.from({ length: pageCount }, (_, pageIndex) => (
                <SignPageStage
                  key={pageIndex}
                  pageIndex={pageIndex}
                  fileBytes={fileBytes}
                  password={password}
                  placement={placement}
                  signatureUrl={signatureUrl}
                  onPlacementChange={setPlacement}
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !canSign}
              onClick={() => void onSign()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign &amp; Download PDF
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5"
            >
              Choose another file
            </button>
          </div>
        </div>
      ) : null}

      <SignatureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSignatureSaved}
      />

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? "Adjust placement and try again." : "");
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
        label="Sign & Download"
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}
