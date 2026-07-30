"use client";

import { useWorkspaceProjectBridge } from "@/components/WorkspaceProjectRegistry";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useConsumePendingFiles } from "@/hooks/useConsumePendingFiles";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  DEFAULT_EML_OPTIONS,
  buildEmlPreviewHtml,
  convertEmlMessageToPdf,
  emlToPdfOutputName,
  parseEmlFile,
  type EmlPdfFontSize,
  type EmlPdfOrientation,
  type EmlPdfPageSize,
  type EmlToPdfOptions,
  type EmlToPdfProgressPhase,
  type ParsedEmlMessage,
} from "@/lib/eml-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { formatsFromAcceptAttr } from "@/lib/upload-accept";
import { formatBytes } from "@/lib/pdf-to-word";
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

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function progressPercent(phase: EmlToPdfProgressPhase | null, busy: boolean): number {
  if (!phase) return busy ? 10 : 0;
  if (phase === "parsing") return 28;
  if (phase === "rendering") return 62;
  return 90;
}

const ACCEPT = ".eml,message/rfc822,application/vnd.ms-outlook";

function acceptEml(file: File): boolean {
  return (
    /\.eml$/i.test(file.name) ||
    /message\/rfc822/i.test(file.type) ||
    /application\/vnd\.ms-outlook/i.test(file.type)
  );
}

export function EmlToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<ParsedEmlMessage | null>(null);
  const [options, setOptions] = useState<EmlToPdfOptions>(DEFAULT_EML_OPTIONS);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [phase, setPhase] = useState<EmlToPdfProgressPhase | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const downloadLabel = ws.wsText("downloadLabel") || "Download PDF";
  const stickyDownloadLabel = ws.wsText("stickyDownloadLabel") || downloadLabel;

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const previewHtml = useMemo(() => {
    if (!message) return "";
    return buildEmlPreviewHtml(message, options);
  }, [message, options]);

  const reset = useCallback(() => {
    setFile(null);
    setMessage(null);
    setOptions(DEFAULT_EML_OPTIONS);
    setOutputBlob(null);
    setPhase(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = useCallback(
    async (picked: File) => {
      if (!acceptEml(picked)) {
        setStatus(ws.wsStatus("invalidType"));
        return;
      }
      if (picked.size === 0) {
        setStatus(ws.wsStatus("emptyFile"));
        return;
      }

      setBusy(true);
      setDone(false);
      setRunError(null);
      setOutputBlob(null);
      setPhase("parsing");
      setStatus(ws.wsStatus("parsing"));

      try {
        const parsed = await parseEmlFile(picked);
        setFile(picked);
        setMessage(parsed);
        setStatus(ws.wsStatus("fileReady", { name: picked.name }));
        capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
      } catch (error) {
        const parsedErr = classifyPdfError(error);
        setRunError(parsedErr);
        setStatus("");
        setFile(null);
        setMessage(null);
      } finally {
        setBusy(false);
        setPhase(null);
      }
    },
    [tool.operation, ws],
  );

  useConsumePendingFiles(acceptEml, (incoming) => {
    const next = incoming[0];
    if (next) void pickFile(next);
  });

  const patchOptions = <K extends keyof EmlToPdfOptions>(key: K, value: EmlToPdfOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
    setDone(false);
    setOutputBlob(null);
  };

  const onDownloadPdf = async () => {
    if (!file || !message || busy) return;

    if (outputBlob) {
      downloadBlob(outputBlob, emlToPdfOutputName(file, message.subject));
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      return;
    }

    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("rendering");
    setStatus(ws.wsStatus("rendering"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await convertEmlMessageToPdf(message, options, (nextPhase) => {
        setPhase(nextPhase);
        setStatus(wsProgressPhase(ws, nextPhase));
      });
      setOutputBlob(blob);
      downloadBlob(blob, emlToPdfOutputName(file, message.subject));
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

  const showWorkspace = Boolean(file && message);


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
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell active={showWorkspace}>
        {!showWorkspace ? (
          <FileUploadZone
            operation={tool.operation}
            drag={drag}
            role="button"
            tabIndex={0}
            aria-controls={`${baseId}-input`}
            className="cursor-pointer"
            title={ws.uploadTitle()}
            description={ws.uploadDescription()}
            supportedFormats={formatsFromAcceptAttr(ACCEPT)}
            accept={ACCEPT}
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
                accept={ACCEPT}
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

      {showWorkspace && message && file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatBytes(file.size)}
                {message.attachmentNames.length
                  ? ` · ${ws.wsUi("attachmentsCount", { count: message.attachmentNames.length })}`
                  : ""}
              </p>
            </div>
            <span className="rounded-none border border-neutral-300 bg-neutral-200 px-3 py-1 text-xs font-medium text-black dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="grid gap-3 rounded-none border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2 md:p-3">
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              <span className="font-medium text-ink">{ws.wsUi("orientationLabel")}</span>
              <select
                value={options.orientation}
                disabled={busy}
                onChange={(e) => patchOptions("orientation", e.target.value as EmlPdfOrientation)}
                className="rounded-none border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-neutral-300 focus:outline-none dark:border-neutral-800"
              >
                <option value="portrait">{ws.wsUi("orientationPortrait")}</option>
                <option value="landscape">{ws.wsUi("orientationLandscape")}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              <span className="font-medium text-ink">{ws.wsUi("pageSizeLabel")}</span>
              <select
                value={options.pageSize}
                disabled={busy}
                onChange={(e) => patchOptions("pageSize", e.target.value as EmlPdfPageSize)}
                className="rounded-none border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-neutral-300 focus:outline-none dark:border-neutral-800"
              >
                <option value="a4">{ws.wsUi("pageSizeA4")}</option>
                <option value="letter">{ws.wsUi("pageSizeLetter")}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              <span className="font-medium text-ink">{ws.wsUi("fontSizeLabel")}</span>
              <select
                value={options.fontSize}
                disabled={busy}
                onChange={(e) => patchOptions("fontSize", e.target.value as EmlPdfFontSize)}
                className="rounded-none border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-neutral-300 focus:outline-none dark:border-neutral-800"
              >
                <option value="small">{ws.wsUi("fontSizeSmall")}</option>
                <option value="medium">{ws.wsUi("fontSizeMedium")}</option>
                <option value="large">{ws.wsUi("fontSizeLarge")}</option>
              </select>
            </label>

            <div className="flex flex-col justify-end gap-2 text-sm text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeHeaders}
                  disabled={busy}
                  onChange={(e) => patchOptions("includeHeaders", e.target.checked)}
                />
                <span>{ws.wsUi("includeHeaders")}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeAttachmentsList}
                  disabled={busy}
                  onChange={(e) => patchOptions("includeAttachmentsList", e.target.checked)}
                />
                <span>{ws.wsUi("includeAttachments")}</span>
              </label>
            </div>
          </div>

          <div className="rounded-none border border-white/10 bg-black/20 p-3 text-sm">
            <h2 className="mb-2 text-sm font-semibold text-ink">{ws.wsUi("headersHeading")}</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted">{ws.wsUi("fromLabel")}</dt>
                <dd className="mt-0.5 break-words text-ink">{message.from}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted">{ws.wsUi("toLabel")}</dt>
                <dd className="mt-0.5 break-words text-ink">{message.to}</dd>
              </div>
              {message.cc ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-muted">{ws.wsUi("ccLabel")}</dt>
                  <dd className="mt-0.5 break-words text-ink">{message.cc}</dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-ink-muted">{ws.wsUi("subjectLabel")}</dt>
                <dd className="mt-0.5 break-words font-medium text-ink">{message.subject}</dd>
              </div>
              {message.date ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-muted">{ws.wsUi("dateLabel")}</dt>
                  <dd className="mt-0.5 text-ink">{message.date}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink">{ws.wsUi("previewHeading")}</h2>
            <div className="overflow-hidden rounded-none border border-white/10 bg-white">
              <iframe
                title={ws.wsUi("previewIframeTitle")}
                className="h-[min(70vh,720px)] min-h-[420px] w-full bg-white"
                sandbox="allow-same-origin"
                srcDoc={previewHtml}
              />
            </div>
          </div>

          {busy ? (
            <WorkspaceProgressBar
              percent={progressPercent(phase, busy)}
              label={wsProgressPhase(ws, phase)}
            />
          ) : null}

          <div className="flex flex-wrap gap-3" data-workspace-actions="">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDownloadPdf()}
              className="rounded-none bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => startNewUpload(reset)}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>

          <p className="text-sm text-ink-muted">{ws.wsText("outputHint")}</p>
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
            setStatus(file ? ws.status("tryAgainOrChoose") : "");
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
        label={stickyDownloadLabel}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
