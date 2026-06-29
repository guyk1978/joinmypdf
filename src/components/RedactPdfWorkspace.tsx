"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  REDACT_UI_SCALE,
  findKeywordRedactionRects,
  type NormalizedRedactionRect,
  renderPdfPageForUi,
} from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
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

function redactOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-redacted.pdf`;
}

type DragState = {
  pageIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function PageCanvas({
  pageIndex,
  fileBytes,
  password,
  boxes,
  draft,
  onAddBox,
  onDraftChange,
  pageLabel,
  loadingLabel,
  markHint,
}: {
  pageIndex: number;
  fileBytes: Uint8Array;
  password: string;
  boxes: NormalizedRedactionRect[];
  draft: DragState | null;
  onAddBox: (box: NormalizedRedactionRect) => void;
  onDraftChange: (draft: DragState | null) => void;
  pageLabel: string;
  loadingLabel: string;
  markHint: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, pageIndex, password, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  const pageBoxes = boxes.filter((b) => b.pageIndex === pageIndex);
  const activeDraft = draft?.pageIndex === pageIndex ? draft : null;

  const pointerPos = (event: ReactMouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const commitDraft = (state: DragState) => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    const left = Math.min(state.startX, state.currentX);
    const top = Math.min(state.startY, state.currentY);
    const width = Math.abs(state.currentX - state.startX);
    const height = Math.abs(state.currentY - state.startY);
    if (width < 6 || height < 6) return;
    onAddBox({
      pageIndex,
      nx: left / w,
      ny: top / h,
      nw: width / w,
      nh: height / h,
    });
  };

  const draftStyle = activeDraft
    ? (() => {
        const w = wrapRef.current?.clientWidth || 1;
        const h = wrapRef.current?.clientHeight || 1;
        return {
          left: `${(Math.min(activeDraft.startX, activeDraft.currentX) / w) * 100}%`,
          top: `${(Math.min(activeDraft.startY, activeDraft.currentY) / h) * 100}%`,
          width: `${(Math.abs(activeDraft.currentX - activeDraft.startX) / w) * 100}%`,
          height: `${(Math.abs(activeDraft.currentY - activeDraft.startY) / h) * 100}%`,
        };
      })()
    : undefined;

  return (
    <div className="redact-page">
      <p className="redact-page__label">{pageLabel}</p>
      <div className="redact-page__studio">
      <div
        ref={wrapRef}
        className="redact-page__stage"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          const p = pointerPos(e);
          onDraftChange({ pageIndex, startX: p.x, startY: p.y, currentX: p.x, currentY: p.y });
        }}
        onMouseMove={(e) => {
          if (!activeDraft) return;
          const p = pointerPos(e);
          onDraftChange({ ...activeDraft, currentX: p.x, currentY: p.y });
        }}
        onMouseUp={() => {
          if (!activeDraft) return;
          commitDraft(activeDraft);
          onDraftChange(null);
        }}
        onMouseLeave={() => {
          if (!activeDraft) return;
          commitDraft(activeDraft);
          onDraftChange(null);
        }}
      >
        {loading ? (
          <p className="redact-page__loading">{loadingLabel}</p>
        ) : canvasEl ? (
          <canvas
            className="redact-page__canvas"
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
        <div className="redact-page__overlay" aria-hidden="true">
          {pageBoxes.map((box, i) => (
            <span
              key={`${pageIndex}-${i}`}
              className="redact-box"
              style={{
                left: `${box.nx * 100}%`,
                top: `${box.ny * 100}%`,
                width: `${box.nw * 100}%`,
                height: `${box.nh * 100}%`,
              }}
            />
          ))}
          {activeDraft && draftStyle ? (
            <span className="redact-box redact-box--draft" style={draftStyle} />
          ) : null}
        </div>
      </div>
      </div>
      <p className="redact-page__hint">{markHint}</p>
    </div>
  );
}

export function RedactPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [boxes, setBoxes] = useState<NormalizedRedactionRect[]>([]);
  const [draft, setDraft] = useState<DragState | null>(null);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordCaseSensitive, setKeywordCaseSensitive] = useState(false);
  const [keywordBusy, setKeywordBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

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
    setBoxes([]);
    setDraft(null);
    setKeywordQuery("");
    setKeywordCaseSensitive(false);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
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
      setBoxes([]);
      setDraft(null);
      setKeywordQuery("");
      setDone(false);
      setRunError(null);
      setPassword("");

      try {
        const isLocked = await pdf.isPdfEncrypted(picked);
        setEncrypted(isLocked);
      } catch {
        setEncrypted(false);
      }

      try {
        const { loadPdfPageCount } = await import("@/lib/pdf-redact");
        const count = await loadPdfPageCount(bytes, "");
        setPageCount(count);
        setStatus(ws.wsStatus("loadedMarkDrag", { count }));
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
      const { loadPdfPageCount } = await import("@/lib/pdf-redact");
      const count = await loadPdfPageCount(fileBytes, password);
      setPageCount(count);
      setStatus(ws.wsStatus("loadedMark", { count }));
      setRunError(null);
    } catch {
      setStatus(ws.wsStatus("wrongPassword"));
    }
  }, [fileBytes, password]);

  const onFindKeywords = async () => {
    if (!fileBytes || keywordBusy) return;
    const query = keywordQuery.trim();
    if (!query) {
      setStatus(ws.wsStatus("enterKeyword"));
      return;
    }
    if (encrypted && !password.trim()) {
      setStatus(ws.wsStatus("enterPassword"));
      return;
    }

    setKeywordBusy(true);
    setRunError(null);
    setStatus(ws.wsStatus("searchingKeyword"));
    try {
      const found = await findKeywordRedactionRects(fileBytes, query, {
        password,
        caseSensitive: keywordCaseSensitive,
      });
      if (!found.length) {
        setStatus(ws.wsStatus("noKeywordMatches"));
        return;
      }
      setBoxes((prev) => [...prev, ...found]);
      setStatus(ws.wsStatus("keywordMatchesAdded", { count: found.length }));
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    } finally {
      setKeywordBusy(false);
    }
  };

  const onRedact = async () => {
    if (!file || !fileBytes || busy) return;
    if (!boxes.length) {
      setStatus(ws.wsStatus("drawBox"));
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
      const bytes = await pdf.redactPdfFile(file, boxes, password);
      const outName = redactOutputName(file);
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
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-none border border-white/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
            >
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
              <div className="flex flex-wrap gap-2">
                <input
                  id={`${baseId}-password`}
                  type="password"
                  autoComplete="current-password"
                  className="protect-form__input max-w-md flex-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={ws.wsUi("passwordPlaceholder")}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => void reloadWithPassword()}
                  disabled={busy || !password}
                  className="rounded-none border border-white/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white/5"
                >
                  {ws.wsUi("loadPages")}
                </button>
              </div>
            </div>
          ) : null}

          {fileBytes && pageCount > 0 ? (
            <div className="grid gap-3 rounded-none border border-neutral-400/25 bg-neutral-500/[0.06] p-4 ring-1 ring-neutral-400/20 backdrop-blur-md dark:border-neutral-400/35 dark:bg-neutral-500/10">
              <p className="text-sm font-semibold text-ink">{ws.wsUi("keywordHeading")}</p>
              <p className="text-xs text-ink-muted">{ws.wsUi("keywordHint")}</p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block min-w-[200px] flex-1 text-sm">
                  <span className="font-medium text-ink">{ws.wsUi("keywordLabel")}</span>
                  <input
                    type="search"
                    value={keywordQuery}
                    onChange={(e) => setKeywordQuery(e.target.value)}
                    placeholder={ws.wsUi("keywordPlaceholder")}
                    className="protect-form__input mt-1 w-full"
                    disabled={busy || keywordBusy}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void onFindKeywords();
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={keywordCaseSensitive}
                    onChange={(e) => setKeywordCaseSensitive(e.target.checked)}
                    disabled={busy || keywordBusy}
                  />
                  <span>{ws.wsUi("keywordCaseSensitive")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => void onFindKeywords()}
                  disabled={busy || keywordBusy || !keywordQuery.trim()}
                  className="rounded-none border border-white/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
                >
                  {keywordBusy ? ws.wsUi("keywordSearching") : ws.wsUi("keywordFind")}
                </button>
              </div>
            </div>
          ) : null}

          {fileBytes && pageCount > 0 ? (
            <div className="redact-pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <PageCanvas
                  key={i}
                  pageIndex={i}
                  fileBytes={fileBytes}
                  password={password}
                  boxes={boxes}
                  draft={draft}
                  onAddBox={(box) => setBoxes((prev) => [...prev, box])}
                  onDraftChange={setDraft}
                  pageLabel={ws.wsCommon("pageNumber", { page: i + 1 })}
                  loadingLabel={ws.wsCommon("renderingPage")}
                  markHint={ws.wsUi("markHint")}
                />
              ))}
            </div>
          ) : null}

          <div className="redact-toolbar">
            <button
              type="button"
              disabled={busy || !boxes.length}
              onClick={() => setBoxes([])}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5 disabled:opacity-50"
            >
              {ws.wsUi("clearAll")}
            </button>
            <button
              type="button"
              disabled={busy || !boxes.length}
              onClick={() => void onRedact()}
              className={`btn-protect relative ${toolPrimaryBtn}`}
            >
              {busy ? (
                <>
                  <span className="tool-spinner" aria-hidden="true" />
                  <span>{ws.wsText("redactingLabel")}</span>
                </>
              ) : (
                ws.wsText("redactLabel")
              )}
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
            setStatus(ws.wsStatus("adjustFile"));
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={ws.wsText("redactLabel")} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
