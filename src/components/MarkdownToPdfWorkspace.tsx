"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { HtmlContentPreviewModal } from "@/components/HtmlContentPreviewModal";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  convertMarkdownToPdf,
  DEFAULT_MARKDOWN_SAMPLE,
  MARKDOWN_THEMES,
  markdownToPdfOutputName,
  parseMarkdownToHtml,
  previewSurfaceClass,
  readMarkdownFile,
  type MarkdownProgressPhase,
  type MarkdownTheme,
} from "@/lib/markdown-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { wsProgressPhase } from "@/lib/workspace-progress-label";
import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(phase: MarkdownProgressPhase | null, busy: boolean): number {
  if (!phase) return busy ? 10 : 0;
  if (phase === "parsing") return 32;
  if (phase === "rendering") return 68;
  return 92;
}

function themeLabelFor(id: MarkdownTheme, ws: ReturnType<typeof useWorkspaceI18n>): string {
  const map: Record<MarkdownTheme, string> = {
    github: ws.wsUi("themeGithub"),
    "minimal-dark": ws.wsUi("themeMinimalDark"),
    academic: ws.wsUi("themeAcademic"),
  };
  return map[id] || id;
}

export function MarkdownToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const previewUnavailable = ws.wsUi("previewUnavailable");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN_SAMPLE);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewParsed, setPreviewParsed] = useState(false);
  const [theme, setTheme] = useState<MarkdownTheme>("github");
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"editor" | "upload">("editor");
  const [phase, setPhase] = useState<MarkdownProgressPhase | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewPointerRef = useRef<{ x: number; y: number } | null>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const hasMarkdown = Boolean(markdown.trim());
  const downloadReady = hasMarkdown && previewParsed && Boolean(previewHtml) && !busy;

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    let cancelled = false;
    const unavailable = `<p class='text-black dark:text-neutral-200'>${previewUnavailable}</p>`;
    const timer = window.setTimeout(() => {
      void parseMarkdownToHtml(markdown)
        .then((html) => {
          if (cancelled) return;
          setPreviewHtml(html);
          setPreviewParsed(Boolean(markdown.trim()));
        })
        .catch(() => {
          if (cancelled) return;
          setPreviewHtml(unavailable);
          setPreviewParsed(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [markdown, previewUnavailable]);

  const previewStyles = useMemo(() => {
    if (theme === "minimal-dark") {
      return `[&_h1]:text-[#f0f6fc] [&_h2]:text-[#f0f6fc] [&_a]:text-[#58a6ff] [&_pre]:bg-[#161b22] [&_pre]:border [&_pre]:border-[#30363d] [&_code]:font-mono [&_table]:border-collapse [&_th]:border [&_th]:border-[#30363d] [&_td]:border [&_td]:border-[#30363d]`;
    }
    if (theme === "academic") {
      return `[&_h1]:font-serif [&_p]:font-serif [&_pre]:bg-neutral-100 dark:bg-neutral-950 [&_table]:border-collapse [&_th]:border [&_td]:border`;
    }
    return `[&_pre]:bg-[#f6f8fa] [&_table]:border-collapse [&_th]:border [&_td]:border [&_a]:text-[#0969da]`;
  }, [theme]);

  const previewSurface = useMemo(
    () => `${previewSurfaceClass(theme)} ${previewStyles}`,
    [theme, previewStyles],
  );

  const reset = useCallback(() => {
    setMarkdown(DEFAULT_MARKDOWN_SAMPLE);
    setFile(null);
    setPhase(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    setPreviewOpen(false);
    setInputMode("editor");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (picked: File) => {
    try {
      const text = await readMarkdownFile(picked);
      setFile(picked);
      setMarkdown(text);
      setInputMode("editor");
      setDone(false);
      setRunError(null);
      setStatus(ws.wsStatus("fileLoaded", { name: picked.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    }
  };

  const onConvert = async () => {
    if (!hasMarkdown || busy) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("parsing");
    setStatus(ws.wsStatus("compiling"));

    try {
      const blob = await convertMarkdownToPdf(markdown, theme, (p) => {
        setPhase(p);
        setStatus(wsProgressPhase(ws, p));
      });

      const titleLine = markdown.match(/^#\s+(.+)$/m)?.[1];
      downloadBlob(blob, markdownToPdfOutputName(file, titleLine));
      setDone(true);
      setStatus(ws.wsStatus("complete"));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setPhase(null);
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

  const onPreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    previewPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPreviewClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!previewHtml) return;
    const start = previewPointerRef.current;
    previewPointerRef.current = null;
    if (start) {
      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      // Treat drag/scroll gestures as non-clicks so vertical scrolling stays usable.
      if (dx > 6 || dy > 6) return;
    }
    setPreviewOpen(true);
  };


  const onRestoreProject = useCallback((payload: { files: File[] }) => {
    const next = payload.files[0];
    if (!next) return;
    void pickFile(next);
  }, []);

  useWorkspaceProjectBridge({
    files: file ? [file] : [],
    disabled: !file || busy,
    onRestore: onRestoreProject,
  });

  return (
    <div id="tool-workspace" className="markdown-pdf-workspace space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={Boolean(file)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-none border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setInputMode("editor")}
              className={clsx(
                "markdown-pdf-tab",
                inputMode === "editor" && "markdown-pdf-tab--active",
              )}
            >
              {ws.wsUi("tabEditor")}
            </button>
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={clsx(
                "markdown-pdf-tab",
                inputMode === "upload" && "markdown-pdf-tab--active",
              )}
            >
              {ws.wsUi("tabUpload")}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{ws.wsUi("themeLabel")}</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as MarkdownTheme)}
              className="markdown-pdf-theme-select"
            >
              {MARKDOWN_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {themeLabelFor(t.id, ws)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {inputMode === "upload" ? (
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
                accept=".md,text/markdown,text/x-markdown"
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

      <div id={WORKSPACE_OPERATIONS_ID} className="markdown-pdf-panes">
        <div className="markdown-pdf-pane">
          <div className="markdown-pdf-pane__head">
            <h2 className="markdown-pdf-pane__title">{ws.wsUi("sourceHeading")}</h2>
            {file ? <span className="markdown-pdf-pane__meta">{file.name}</span> : null}
          </div>
          <textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setDone(false);
            }}
            spellCheck={false}
            className="markdown-pdf-editor"
            placeholder={ws.wsUi("editorPlaceholder")}
            aria-label={ws.wsUi("editorAriaLabel")}
          />
        </div>

        <div className="markdown-pdf-pane">
          <div className="markdown-pdf-pane__head">
            <h2 className="markdown-pdf-pane__title">{ws.wsUi("previewHeading")}</h2>
            {previewHtml ? (
              <span className="markdown-pdf-pane__meta">{ws.wsUi("previewClickHint")}</span>
            ) : null}
          </div>
          <div
            role="button"
            tabIndex={previewHtml ? 0 : -1}
            className={clsx(
              "markdown-pdf-preview",
              previewSurface,
              previewHtml && "markdown-pdf-preview--ready",
            )}
            onPointerDown={onPreviewPointerDown}
            onClick={onPreviewClick}
            onKeyDown={(e) => {
              if (!previewHtml) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPreviewOpen(true);
              }
            }}
            aria-label={ws.wsUi("openPreviewAria")}
            title={ws.wsUi("openPreviewAria")}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {busy ? (
        <WorkspaceProgressBar
          percent={progressPercent(phase, busy)}
          label={wsProgressPhase(ws, phase)}
        />
      ) : null}

      <div className="markdown-pdf-actions">
        <button
          type="button"
          disabled={!downloadReady}
          onClick={() => void onConvert()}
          className={clsx(
            "markdown-pdf-btn markdown-pdf-btn--primary",
            downloadReady && "is-ready",
          )}
        >
          {ws.wsText("downloadLabel")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="markdown-pdf-btn markdown-pdf-btn--secondary"
        >
          {ws.wsCommon("resetSample")}
        </button>
        <WorkspaceNewUploadButton
          label={ws.uploadNewFile}
          disabled={busy}
          onClick={() => startNewUpload(reset)}
          className="markdown-pdf-btn markdown-pdf-btn--secondary"
        />
      </div>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(ws.wsStatus("adjustMarkdown"));
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
        label={ws.wsText("downloadLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />

      <HtmlContentPreviewModal
        open={previewOpen}
        html={previewHtml}
        contentClassName={previewSurface}
        title={ws.wsUi("previewModalTitle")}
        closeLabel={ws.wsUi("closePreview")}
        zoomInLabel={ws.wsUi("zoomIn")}
        zoomOutLabel={ws.wsUi("zoomOut")}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
