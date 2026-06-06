"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  convertHtmlToPdf,
  DEFAULT_HTML_SAMPLE,
  htmlToPdfOutputName,
  readHtmlFile,
  type HtmlPdfMargin,
  type HtmlPdfOrientation,
  type HtmlToPdfProgressPhase,
} from "@/lib/html-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { wsProgressPhase } from "@/lib/workspace-progress-label";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type InputMode = "upload" | "paste";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(phase: HtmlToPdfProgressPhase | null, busy: boolean): number {
  if (!phase) return busy ? 10 : 0;
  if (phase === "rendering") return 30;
  if (phase === "capturing") return 64;
  return 92;
}

export function HtmlToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [mode, setMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML_SAMPLE);
  const [orientation, setOrientation] = useState<HtmlPdfOrientation>("portrait");
  const [margin, setMargin] = useState<HtmlPdfMargin>("normal");
  const [phase, setPhase] = useState<HtmlToPdfProgressPhase | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const previewDoc = useMemo(() => {
    const trimmed = htmlCode.trim();
    if (!trimmed) return "";
    return trimmed;
  }, [htmlCode]);

  const reset = useCallback(() => {
    setFile(null);
    setHtmlCode(DEFAULT_HTML_SAMPLE);
    setOrientation("portrait");
    setMargin("normal");
    setPhase(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    setMode("upload");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (picked: File) => {
    try {
      const text = await readHtmlFile(picked);
      setFile(picked);
      setHtmlCode(text);
      setMode("paste");
      setDone(false);
      setRunError(null);
      setStatus(ws.wsStatus("fileLoaded", { name: picked.name }));
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (error) {
      const parsed = classifyPdfError(error);
      setRunError(parsed);
      setStatus("");
    }
  };

  const onConvert = async () => {
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("rendering");
    setStatus(ws.wsStatus("preparingSandbox"));

    try {
      const blob = await convertHtmlToPdf(
        htmlCode,
        { orientation, margin },
        (nextPhase) => {
          setPhase(nextPhase);
          setStatus(wsProgressPhase(ws, nextPhase));
        },
      );
      downloadBlob(blob, htmlToPdfOutputName(file));
      setDone(true);
      setStatus(ws.wsStatus("complete"));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (error) {
      const parsed = classifyPdfError(error);
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

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell securePrefix={ws.securePrefix} privacyNote={ws.wsText("privacyNote")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-none border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded-none px-4 py-2 text-sm font-medium transition ${ mode === "upload" ? "bg-neutral-200 dark:bg-neutral-800 text-surface" : "text-ink-muted hover:text-ink" }`}
          >
            {ws.wsUi("tabUpload")}
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`rounded-none px-4 py-2 text-sm font-medium transition ${ mode === "paste" ? "bg-neutral-200 dark:bg-neutral-800 text-surface" : "text-ink-muted hover:text-ink" }`}
          >
            {ws.wsUi("tabPaste")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink-muted">
            <span className="me-2 font-medium text-ink">{ws.wsUi("orientationLabel")}</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as HtmlPdfOrientation)}
              className="rounded-none border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-neutral-300 dark:border-neutral-800 focus:outline-none"
            >
              <option value="portrait">{ws.wsUi("orientationPortrait")}</option>
              <option value="landscape">{ws.wsUi("orientationLandscape")}</option>
            </select>
          </label>
          <label className="text-sm text-ink-muted">
            <span className="me-2 font-medium text-ink">{ws.wsUi("marginLabel")}</span>
            <select
              value={margin}
              onChange={(e) => setMargin(e.target.value as HtmlPdfMargin)}
              className="rounded-none border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-neutral-300 dark:border-neutral-800 focus:outline-none"
            >
              <option value="normal">{ws.wsUi("marginNormal")}</option>
              <option value="none">{ws.wsUi("marginNone")}</option>
            </select>
          </label>
        </div>
      </div>

      {mode === "upload" ? (
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
              accept=".html,.htm,text/html"
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

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{ws.wsUi("sourceHeading")}</h2>
            {file ? <span className="text-xs text-ink-muted">{file.name}</span> : null}
          </div>
          <textarea
            value={htmlCode}
            onChange={(e) => {
              setHtmlCode(e.target.value);
              setDone(false);
            }}
            spellCheck={false}
            className="min-h-[320px] w-full resize-y rounded-none border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-muted/60 focus:border-neutral-300 dark:border-neutral-800 focus:outline-none lg:min-h-[460px]"
            placeholder={ws.wsUi("editorPlaceholder")}
            aria-label={ws.wsUi("editorAriaLabel")}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">{ws.wsUi("previewHeading")}</h2>
          <div className="min-h-[320px] overflow-hidden rounded-none border border-white/10 bg-white lg:min-h-[460px]">
            <iframe
              title={ws.wsUi("previewIframeTitle")}
              className="h-[320px] w-full bg-white lg:h-[460px]"
              sandbox="allow-same-origin"
              srcDoc={previewDoc}
            />
          </div>
        </div>
      </div>

      {busy ? (
        <WorkspaceProgressBar
          percent={progressPercent(phase, busy)}
          label={wsProgressPhase(ws, phase)}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || !htmlCode.trim()}
          onClick={() => void onConvert()}
          className="rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-surface transition hover:bg-neutral-200 dark:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ws.wsText("convertLabel")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
        >
          {ws.wsCommon("resetSample")}
        </button>
      </div>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(ws.wsStatus("adjustHtml"));
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={ws.wsText("convertLabel")} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
