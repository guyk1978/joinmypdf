"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { SignPageSelect } from "@/components/SignPageSelect";
import { SignatureModal } from "@/components/SignatureModal";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  buildSignatureTextStamps,
  createSignatureId,
  defaultSignaturePlacement,
  formatSignatureDate,
  instanceToPlacement,
  loadPdfPageCount,
  pngBytesToDataUrl,
  renderPdfPageForUi,
  signPdfOutputName,
  type SavedSignature,
  type SignatureInstance,
  type TextStamp,
} from "@/lib/pdf-sign";
import { useLocale } from "next-intl";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolInput, toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
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

type DragMode = {
  type: "move" | "resize";
  instanceId: string;
  startX: number;
  startY: number;
  orig: Pick<SignatureInstance, "nx" | "ny" | "nw" | "nh">;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function SignPageStage({
  pageIndex,
  fileBytes,
  password,
  instances,
  savedById,
  onInstanceChange,
  onRemoveInstance,
  pageLabel,
  renderingPageLabel,
  signatureAlt,
  removeSignatureLabel,
  resizeSignatureLabel,
  signaturesOnPageHint,
  placeHint,
  includeDate,
  signerName,
  signerTitle,
  datePreviewLabel,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  instances: SignatureInstance[];
  savedById: Map<string, SavedSignature>;
  onInstanceChange: (instanceId: string, patch: Partial<SignatureInstance>) => void;
  onRemoveInstance: (instanceId: string) => void;
  pageLabel: string;
  renderingPageLabel: string;
  signatureAlt: string;
  removeSignatureLabel: string;
  resizeSignatureLabel: string;
  signaturesOnPageHint: string;
  placeHint: string;
  includeDate: boolean;
  signerName: string;
  signerTitle: string;
  datePreviewLabel: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<DragMode | null>(null);

  const pageInstances = instances.filter((i) => i.pageIndex === pageIndex);

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
    if (!drag || !stage) return;
    const inst = pageInstances.find((i) => i.id === drag.instanceId);
    if (!inst) return;

    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    const p = pointerInStage(event);
    const dx = (p.x - drag.startX) / w;
    const dy = (p.y - drag.startY) / h;
    const o = drag.orig;

    if (drag.type === "move") {
      onInstanceChange(drag.instanceId, {
        nx: clamp01(o.nx + dx),
        ny: clamp01(o.ny + dy),
      });
    } else {
      onInstanceChange(drag.instanceId, {
        nw: clamp01(Math.max(0.08, o.nw + dx)),
        nh: clamp01(Math.max(0.04, o.nh + dy)),
      });
    }
  };

  return (
    <div className="sign-page">
      <p className="sign-page__label">{pageLabel}</p>
      <div className="sign-page__studio">
      <div
        ref={stageRef}
        className="sign-page__stage"
        onPointerMove={onPointerMove}
        onPointerUp={commitDrag}
        onPointerLeave={commitDrag}
      >
        {loading ? (
          <p className="sign-page__loading">{renderingPageLabel}</p>
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
        {pageInstances.map((inst) => {
          const saved = savedById.get(inst.savedId);
          if (!saved) return null;
          const textLabels = buildSignatureTextStamps(instanceToPlacement(inst), {
            includeDate,
            signerName,
            signerTitle,
            dateText: datePreviewLabel,
          });
          return (
            <div key={inst.id}>
              <div
                className="sign-plaque"
                style={{
                  left: `${inst.nx * 100}%`,
                  top: `${inst.ny * 100}%`,
                  width: `${inst.nw * 100}%`,
                  height: `${inst.nh * 100}%`,
                }}
                onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest(".sign-plaque__remove")) return;
                if ((e.target as HTMLElement).closest(".sign-plaque__handle")) return;
                if (e.button !== 0) return;
                e.stopPropagation();
                const p = pointerInStage(e);
                dragRef.current = {
                  type: "move",
                  instanceId: inst.id,
                  startX: p.x,
                  startY: p.y,
                  orig: { nx: inst.nx, ny: inst.ny, nw: inst.nw, nh: inst.nh },
                };
              }}
            >
              <img src={saved.dataUrl} alt={signatureAlt} className="sign-plaque__img" draggable={false} />
              <button
                type="button"
                className="sign-plaque__remove"
                aria-label={removeSignatureLabel}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveInstance(inst.id);
                }}
              >
                ×
              </button>
              <span
                className="sign-plaque__handle"
                aria-label={resizeSignatureLabel}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  const p = pointerInStage(e);
                  dragRef.current = {
                    type: "resize",
                    instanceId: inst.id,
                    startX: p.x,
                    startY: p.y,
                    orig: { nx: inst.nx, ny: inst.ny, nw: inst.nw, nh: inst.nh },
                  };
                }}
              />
            </div>
              {textLabels.map((label, idx) => (
                <div
                  key={`${inst.id}-label-${idx}`}
                  className="sign-text-label pointer-events-none absolute text-[10px] font-medium leading-tight text-neutral-700 dark:text-neutral-300 sm:text-xs"
                  style={{
                    left: `${label.nx * 100}%`,
                    top: `${label.ny * 100}%`,
                    maxWidth: "40%",
                  }}
                >
                  {label.text}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      </div>
      {pageInstances.length > 0 ? (
        <p className="sign-page__hint">{signaturesOnPageHint}</p>
      ) : (
        <p className="sign-page__hint">{placeHint}</p>
      )}
    </div>
  );
}

export function SignPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [instances, setInstances] = useState<SignatureInstance[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [includeDate, setIncludeDate] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const savedById = new Map(savedSignatures.map((s) => [s.id, s]));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPassword("");
    setEncrypted(false);
    setSavedSignatures([]);
    setInstances([]);
    setActivePageIndex(0);
    setIncludeDate(true);
    setSignerName("");
    setSignerTitle("");
    setModalOpen(false);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addInstance = useCallback((savedId: string, pageIndex: number) => {
    const base = defaultSignaturePlacement(pageIndex);
    const inst: SignatureInstance = {
      id: createSignatureId(),
      savedId,
      pageIndex: base.pageIndex,
      nx: base.nx,
      ny: base.ny,
      nw: base.nw,
      nh: base.nh,
    };
    setInstances((prev) => [...prev, inst]);
    return inst.id;
  }, []);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setSavedSignatures([]);
      setInstances([]);
      setActivePageIndex(0);
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
        setStatus(ws.wsStatus("loadedSign", { count }));
      } catch {
        setPageCount(0);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation],
  );

  const reloadWithPassword = useCallback(async () => {
    if (!fileBytes) return;
    try {
      const count = await loadPdfPageCount(fileBytes, password);
      setPageCount(count);
      setStatus(ws.wsStatus("loaded", { count }));
      setRunError(null);
    } catch {
      setStatus(ws.wsStatus("wrongPassword"));
    }
  }, [fileBytes, password]);

  const onSignatureSaved = async (bytes: Uint8Array, label: string) => {
    const dataUrl = await pngBytesToDataUrl(bytes);
    const saved: SavedSignature = {
      id: createSignatureId(),
      dataUrl,
      pngBytes: bytes,
      label,
    };
    setSavedSignatures((prev) => [...prev, saved]);
    addInstance(saved.id, activePageIndex);
    setStatus(ws.wsStatus("signatureSaved"));
  };

  const placeSavedSignature = (savedId: string) => {
    addInstance(savedId, activePageIndex);
    setStatus(ws.wsStatus("addedOnPage", { page: activePageIndex + 1 }));
  };

  const removeSavedSignature = (savedId: string) => {
    setSavedSignatures((prev) => prev.filter((s) => s.id !== savedId));
    setInstances((prev) => prev.filter((i) => i.savedId !== savedId));
  };

  const onInstanceChange = (instanceId: string, patch: Partial<SignatureInstance>) => {
    setInstances((prev) =>
      prev.map((inst) => (inst.id === instanceId ? { ...inst, ...patch } : inst)),
    );
  };

  const onSign = async () => {
    if (!file || !fileBytes || busy) return;
    if (!instances.length) {
      setStatus(ws.wsStatus("placeSignature"));
      return;
    }
    if (encrypted && !password.trim()) {
      setStatus(ws.wsStatus("enterPassword"));
      return;
    }

    const stamps = instances.map((inst) => {
      const saved = savedById.get(inst.savedId);
      if (!saved) throw new Error("A placed signature is no longer available.");
      return {
        signaturePng: saved.pngBytes,
        placement: instanceToPlacement(inst),
      };
    });

    const dateText = formatSignatureDate(new Date(), locale);
    const textStamps: TextStamp[] = instances.flatMap((inst) =>
      buildSignatureTextStamps(instanceToPlacement(inst), {
        includeDate,
        signerName,
        signerTitle,
        dateText,
      }),
    );

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.signPdfFile(file, stamps, password, textStamps);
      const outName = signPdfOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
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

  const canSign = instances.length > 0;

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
        <div className="sign-workspace space-y-2">
          {encrypted ? (
            <div className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-white p-4 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
              <label className="text-sm font-medium text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200" htmlFor={`${baseId}-pwd`}>
                {ws.wsUi("passwordLabel")}
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <input
                  id={`${baseId}-pwd`}
                  type="password"
                  className={`min-w-[200px] flex-1 ${toolInput}`}
                  autoComplete="current-password"
                  placeholder={ws.wsUi("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="btn btn--ghost" onClick={() => void reloadWithPassword()}>
                  {ws.wsUi("loadPages")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="sign-layout">
            <aside className="sign-library" aria-label={ws.wsUi("libraryTitle")}>
              <div className="sign-library__head">
                <h2 className="sign-library__title">{ws.wsUi("libraryTitle")}</h2>
                <button type="button" className="btn btn--primary sign-library__add" onClick={() => setModalOpen(true)}>
                  {ws.wsUi("newSignature")}
                </button>
              </div>
              <p className="sign-library__hint">{ws.wsUi("libraryHint")}</p>
              {savedSignatures.length === 0 ? (
                <p className="sign-library__empty">{ws.wsUi("libraryEmpty")}</p>
              ) : (
                <ul className="sign-library__list">
                  {savedSignatures.map((saved, index) => (
                    <li key={saved.id} className="sign-saved-item">
                      <button
                        type="button"
                        className="sign-saved-item__place"
                        onClick={() => placeSavedSignature(saved.id)}
                        title={ws.wsUi("placeOnPage", { page: activePageIndex + 1 })}
                      >
                        <img src={saved.dataUrl} alt="" className="sign-saved-item__thumb" />
                        <span className="sign-saved-item__label">
                          {saved.label || ws.wsUi("defaultSignatureLabel", { n: index + 1 })}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="sign-saved-item__delete"
                        aria-label={ws.wsUi("removeNamed", {
                          label: saved.label || ws.wsUi("defaultSignatureLabel", { n: index + 1 }),
                        })}
                        onClick={() => removeSavedSignature(saved.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <div className="sign-main space-y-2">
              <div className="grid gap-3 rounded-none border border-neutral-400/30 bg-neutral-500/[0.06] p-4 ring-1 ring-neutral-400/20 backdrop-blur-md dark:border-neutral-400/40 dark:bg-neutral-500/10">
                <p className="text-sm font-semibold text-ink">{ws.wsUi("extrasHeading")}</p>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={includeDate}
                    onChange={(e) => setIncludeDate(e.target.checked)}
                  />
                  <span>{ws.wsUi("includeDateLabel")}</span>
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-semibold text-ink">{ws.wsUi("signerNameLabel")}</span>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder={ws.wsUi("signerNamePlaceholder")}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-semibold text-ink">{ws.wsUi("signerTitleLabel")}</span>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      className="mt-1 w-full rounded-none border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder={ws.wsUi("signerTitlePlaceholder")}
                    />
                  </label>
                </div>
                <p className="text-xs text-ink-muted">{ws.wsUi("extrasHint")}</p>
              </div>

              <SignPageSelect
                pageCount={pageCount}
                value={activePageIndex}
                onChange={setActivePageIndex}
              />

              {pageCount > 0 ? (
                <div className="sign-pages">
                  {Array.from({ length: pageCount }, (_, pageIndex) => (
                    <SignPageStage
                      key={pageIndex}
                      pageIndex={pageIndex}
                      fileBytes={fileBytes}
                      password={password}
                      instances={instances}
                      savedById={savedById}
                      onInstanceChange={onInstanceChange}
                      onRemoveInstance={(id) =>
                        setInstances((prev) => prev.filter((i) => i.id !== id))
                      }
                      pageLabel={ws.wsCommon("pageNumber", { page: pageIndex + 1 })}
                      renderingPageLabel={ws.wsCommon("renderingPage")}
                      signatureAlt={ws.wsUi("signatureAlt")}
                      removeSignatureLabel={ws.wsUi("removeSignature")}
                      resizeSignatureLabel={ws.wsUi("resizeSignature")}
                      signaturesOnPageHint={ws.wsUi("signaturesOnPage", {
                        count: instances.filter((i) => i.pageIndex === pageIndex).length,
                      })}
                      placeHint={ws.wsUi("placeHint")}
                      includeDate={includeDate}
                      signerName={signerName}
                      signerTitle={signerTitle}
                      datePreviewLabel={formatSignatureDate(new Date(), locale)}
                    />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy || !canSign}
                  onClick={() => void onSign()}
                  className={toolPrimaryBtn}
                >
                  {ws.wsText("signDownloadLabel")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={reset}
                  className={toolSecondaryBtn}
                >
                  {ws.chooseAnotherFile}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SignatureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(bytes, label) => void onSignatureSaved(bytes, label)}
      />

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? ws.wsStatus("adjustPlacement") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}
      </WorkspaceUploadShell>
      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("stickyLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
