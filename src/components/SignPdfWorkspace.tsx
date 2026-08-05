"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useConsumePendingFiles } from "@/hooks/useConsumePendingFiles";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { SignPageSelect } from "@/components/SignPageSelect";
import { SignatureCreator } from "@/components/SignatureModal";
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
import { friendlyPdfPreviewMessage } from "@/lib/pdf-render";
import { useLocale } from "next-intl";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolInput, toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  Fragment,
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
  startClientX: number;
  startClientY: number;
  stageW: number;
  stageH: number;
  orig: Pick<SignatureInstance, "nx" | "ny" | "nw" | "nh">;
  pointerId: number;
};

function SignPageStage({
  pageIndex,
  fileBytes,
  password,
  instances,
  savedById,
  pendingSavedId,
  onPlaceAt,
  onCancelPending,
  onInstanceChange,
  onRemoveInstance,
  pageLabel,
  renderingPageLabel,
  signatureAlt,
  removeSignatureLabel,
  resizeSignatureLabel,
  signaturesOnPageHint,
  placeHint,
  clickToPlaceHint,
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
  /** When set, the next click on the page places this signature (no hover ghost). */
  pendingSavedId: string | null;
  onPlaceAt: (savedId: string, nx: number, ny: number) => void;
  onCancelPending: () => void;
  onInstanceChange: (instanceId: string, patch: Partial<SignatureInstance>) => void;
  onRemoveInstance: (instanceId: string) => void;
  pageLabel: string;
  renderingPageLabel: string;
  signatureAlt: string;
  removeSignatureLabel: string;
  resizeSignatureLabel: string;
  signaturesOnPageHint: string;
  placeHint: string;
  clickToPlaceHint: string;
  includeDate: boolean;
  signerName: string;
  signerTitle: string;
  datePreviewLabel: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLImageElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState("");
  const dragRef = useRef<DragMode | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const onInstanceChangeRef = useRef(onInstanceChange);
  onInstanceChangeRef.current = onInstanceChange;

  const pageInstances = instances.filter((i) => i.pageIndex === pageIndex);
  const placing = Boolean(pendingSavedId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRenderError("");
    setPreviewUrl(null);

    void (async () => {
      try {
        const canvas = await renderPdfPageForUi(fileBytes, pageIndex, password);
        if (cancelled) return;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((next) => resolve(next), "image/png");
        });
        if (!blob) throw new Error("Failed to export the page preview.");

        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch (cause) {
        if (cancelled) return;
        setRenderError(friendlyPdfPreviewMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!placing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancelPending();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placing, onCancelPending]);

  const measurePageBox = () => {
    const el = canvasRef.current ?? stageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    return rect;
  };

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (clientX - drag.startClientX) / drag.stageW;
    const dy = (clientY - drag.startClientY) / drag.stageH;
    const o = drag.orig;
    if (drag.type === "move") {
      onInstanceChangeRef.current(drag.instanceId, {
        nx: Math.max(0, Math.min(1 - o.nw, o.nx + dx)),
        ny: Math.max(0, Math.min(1 - o.nh, o.ny + dy)),
      });
    } else {
      onInstanceChangeRef.current(drag.instanceId, {
        nw: Math.max(0.08, Math.min(1 - o.nx, o.nw + dx)),
        nh: Math.max(0.04, Math.min(1 - o.ny, o.nh + dy)),
      });
    }
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      applyDrag(event.clientX, event.clientY);
    };
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      endDrag();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyDrag, endDrag]);

  const beginDrag = (
    event: ReactPointerEvent,
    type: DragMode["type"],
    instanceId: string,
    orig: DragMode["orig"],
  ) => {
    if (placing || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = measurePageBox();
    if (!rect) return;
    dragRef.current = {
      type,
      instanceId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      stageW: rect.width,
      stageH: rect.height,
      orig: { ...orig },
      pointerId: event.pointerId,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pendingSavedId || event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".sign-plaque")) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = measurePageBox();
    if (!rect) return;
    const size = defaultSignaturePlacement(pageIndex);
    // Click point = center of the new signature, clamped to the page.
    const cx = (event.clientX - rect.left) / rect.width;
    const cy = (event.clientY - rect.top) / rect.height;
    const nx = Math.max(0, Math.min(1 - size.nw, cx - size.nw / 2));
    const ny = Math.max(0, Math.min(1 - size.nh, cy - size.nh / 2));
    onPlaceAt(pendingSavedId, nx, ny);
  };

  return (
    <div className="sign-page">
      <p className="sign-page__label">{pageLabel}</p>
      <div className="sign-page__studio">
        <div
          ref={stageRef}
          className={`sign-page__stage${placing ? " sign-page__stage--placing" : ""}`}
          onPointerDown={onStagePointerDown}
        >
          {loading && !previewUrl ? <p className="sign-page__loading">{renderingPageLabel}</p> : null}
          {!loading && renderError ? (
            <p className="sign-page__loading" role="alert">
              {renderError}
            </p>
          ) : null}
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview from pdf.js canvas
            <img
              ref={canvasRef}
              className="sign-page__canvas"
              src={previewUrl}
              alt={pageLabel}
              draggable={false}
            />
          ) : null}
          <div className="sign-plaque-layer" aria-hidden={pageInstances.length === 0 && !placing}>
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
                <Fragment key={inst.id}>
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
                      beginDrag(e, "move", inst.id, {
                        nx: inst.nx,
                        ny: inst.ny,
                        nw: inst.nw,
                        nh: inst.nh,
                      });
                    }}
                  >
                    <img
                      src={saved.dataUrl}
                      alt={signatureAlt}
                      className="sign-plaque__img"
                      draggable={false}
                    />
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
                        beginDrag(e, "resize", inst.id, {
                          nx: inst.nx,
                          ny: inst.ny,
                          nw: inst.nw,
                          nh: inst.nh,
                        });
                      }}
                    />
                  </div>
                  {textLabels.map((label, idx) => (
                    <div
                      key={`${inst.id}-label-${idx}`}
                      className="sign-text-label"
                      style={{
                        left: `${label.nx * 100}%`,
                        top: `${label.ny * 100}%`,
                      }}
                    >
                      {label.text}
                    </div>
                  ))}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
      {placing ? (
        <p className="sign-page__hint sign-page__hint--placing" role="status">
          {clickToPlaceHint}
        </p>
      ) : pageInstances.length > 0 ? (
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
  /** Armed signature — next click on the PDF page places it (no hover ghost). */
  const [pendingSavedId, setPendingSavedId] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [includeDate, setIncludeDate] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file && fileBytes));
  const baseId = useId();

  const savedById = new Map(savedSignatures.map((s) => [s.id, s]));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    if (pageCount <= 0) return;
    setActivePageIndex((prev) => Math.min(Math.max(0, prev), pageCount - 1));
  }, [pageCount]);

  const safePageIndex =
    pageCount > 0 ? Math.min(Math.max(0, activePageIndex), pageCount - 1) : 0;

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPassword("");
    setEncrypted(false);
    setSavedSignatures([]);
    setInstances([]);
    setPendingSavedId(null);
    setActivePageIndex(0);
    setIncludeDate(true);
    setSignerName("");
    setSignerTitle("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addInstance = useCallback(
    (savedId: string, pageIndex: number, at?: { nx: number; ny: number }) => {
      const base = defaultSignaturePlacement(pageIndex);
      const nx = at
        ? Math.max(0, Math.min(1 - base.nw, at.nx))
        : base.nx;
      const ny = at
        ? Math.max(0, Math.min(1 - base.nh, at.ny))
        : base.ny;
      const inst: SignatureInstance = {
        id: createSignatureId(),
        savedId,
        pageIndex: base.pageIndex,
        nx,
        ny,
        nw: base.nw,
        nh: base.nh,
      };
      setInstances((prev) => [...prev, inst]);
      return inst.id;
    },
    [],
  );

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
      setPendingSavedId(null);
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
        setActivePageIndex(0);
        setStatus(ws.wsStatus("loadedSign", { count }));
      } catch {
        setPageCount(0);
        setActivePageIndex(0);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation],
  );

  useConsumePendingFiles(acceptPdf, (incoming) => {
    void addFile(incoming);
  });

  const reloadWithPassword = useCallback(async () => {
    if (!fileBytes) return;
    try {
      const count = await loadPdfPageCount(fileBytes, password);
      setPageCount(count);
      setActivePageIndex(0);
      setStatus(ws.wsStatus("loaded", { count }));
      setRunError(null);
    } catch {
      setStatus(ws.wsStatus("wrongPassword"));
    }
  }, [fileBytes, password, ws]);

  const onSignatureSaved = async (bytes: Uint8Array, label: string) => {
    const dataUrl = await pngBytesToDataUrl(bytes);
    const saved: SavedSignature = {
      id: createSignatureId(),
      dataUrl,
      pngBytes: bytes,
      label,
    };
    setSavedSignatures((prev) => [...prev, saved]);
    setPendingSavedId(saved.id);
    setStatus(ws.wsStatus("signatureSaved"));
  };

  const placeSavedSignature = (savedId: string) => {
    setPendingSavedId(savedId);
    setStatus(ws.wsStatus("clickPageToPlace", { page: activePageIndex + 1 }));
  };

  const placeAtPoint = useCallback(
    (savedId: string, nx: number, ny: number) => {
      addInstance(savedId, activePageIndex, { nx, ny });
      setPendingSavedId(null);
      setStatus(ws.wsStatus("addedOnPage", { page: activePageIndex + 1 }));
    },
    [activePageIndex, addInstance, ws],
  );

  const cancelPendingPlacement = useCallback(() => {
    setPendingSavedId(null);
  }, []);

  const removeSavedSignature = (savedId: string) => {
    setSavedSignatures((prev) => prev.filter((s) => s.id !== savedId));
    setInstances((prev) => prev.filter((i) => i.savedId !== savedId));
    setPendingSavedId((prev) => (prev === savedId ? null : prev));
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


  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    addFile([next]);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div id="tool-workspace" className="tool-workspace--wide space-y-3 pb-12 md:pb-8">
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
      </WorkspaceUploadShell>

      {file && fileBytes ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="sign-workspace tool-workspace-panel space-y-2">
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
              </div>
              <p className="sign-library__hint">{ws.wsUi("libraryHint")}</p>

              <SignatureCreator onSave={(bytes, label) => void onSignatureSaved(bytes, label)} />

              <div className="sign-library__saved">
                <p className="sign-library__saved-label">{ws.wsUi("savedListHeading")}</p>
                {savedSignatures.length === 0 ? (
                  <p className="sign-library__empty">{ws.wsUi("libraryEmpty")}</p>
                ) : (
                  <ul className="sign-library__list">
                    {savedSignatures.map((saved, index) => (
                      <li
                        key={saved.id}
                        className={`sign-saved-item${pendingSavedId === saved.id ? " is-pending" : ""}`}
                      >
                        <button
                          type="button"
                          className="sign-saved-item__place"
                          onClick={() => placeSavedSignature(saved.id)}
                          aria-pressed={pendingSavedId === saved.id}
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
              </div>
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
                value={safePageIndex}
                onChange={setActivePageIndex}
              />

              {pageCount > 0 && fileBytes ? (
                <div className="sign-pages">
                  <SignPageStage
                    key={`sign-page-${safePageIndex}-${password}`}
                    pageIndex={safePageIndex}
                    fileBytes={fileBytes}
                    password={password}
                    instances={instances}
                    savedById={savedById}
                    pendingSavedId={pendingSavedId}
                    onPlaceAt={placeAtPoint}
                    onCancelPending={cancelPendingPlacement}
                    onInstanceChange={onInstanceChange}
                    onRemoveInstance={(id) =>
                      setInstances((prev) => prev.filter((i) => i.id !== id))
                    }
                    pageLabel={ws.wsCommon("pageNumber", { page: safePageIndex + 1 })}
                    renderingPageLabel={ws.wsCommon("renderingPage")}
                    signatureAlt={ws.wsUi("signatureAlt")}
                    removeSignatureLabel={ws.wsUi("removeSignature")}
                    resizeSignatureLabel={ws.wsUi("resizeSignature")}
                    signaturesOnPageHint={ws.wsUi("signaturesOnPage", {
                      count: instances.filter((i) => i.pageIndex === safePageIndex).length,
                    })}
                    placeHint={ws.wsUi("placeHint")}
                    clickToPlaceHint={ws.wsUi("clickToPlaceHint")}
                    includeDate={includeDate}
                    signerName={signerName}
                    signerTitle={signerTitle}
                    datePreviewLabel={formatSignatureDate(new Date(), locale)}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3" data-workspace-actions="">
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
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
              </div>
            </div>
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
            setStatus(file ? ws.wsStatus("adjustPlacement") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}
      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("stickyLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
