"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  detectIworkKind,
  extractIworkPreviewPdfBytes,
  formatBytes,
  iworkKindLabel,
  iworkToPdfOutputName,
  isIworkFile,
  type IworkProgressPhase,
} from "@/lib/iwork-to-pdf";
import { iworkPackageFallbackLabel } from "@/lib/workspace-preset-i18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { wsProgressPhase } from "@/lib/workspace-progress-label";
import {
  useCallback,
  useEffect,
  useId,
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

export function IworkToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [kindLabel, setKindLabel] = useState("");
  const [phase, setPhase] = useState<IworkProgressPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptIwork = useCallback((f: File) => isIworkFile(f), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setKindLabel("");
    setPhase(null);
    setProgress(0);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = (picked: File) => {
    if (!acceptIwork(picked)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (picked.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }

    const kind = detectIworkKind(picked);
    setFile(picked);
    setKindLabel(kind ? iworkKindLabel(kind) : "");
    setDone(false);
    setRunError(null);
    setPhase(null);
    setProgress(0);
    setStatus(ws.wsStatus("fileReady", { name: picked.name, size: formatBytes(picked.size) }));
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
  };

  const onConvert = async () => {
    if (!file) return;
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("reading");
    setProgress(10);
    setStatus(ws.wsStatus("preparing"));

    try {
      const bytes = await extractIworkPreviewPdfBytes(file, (nextPhase, percent) => {
        setPhase(nextPhase);
        setProgress(percent);
        setStatus(wsProgressPhase(ws, nextPhase));
      });

      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), iworkToPdfOutputName(file));
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
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {ws.wsText("privacyNote")}
      </div>

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
            const picked = e.dataTransfer.files?.[0];
            if (picked) pickFile(picked);
          }}
          onClick={() => inputRef.current?.click()}
          input={
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".pages,.numbers,.key,.keynote,application/zip"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{kindLabel || iworkPackageFallbackLabel(ws)}</p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {ws.clientSideOnly}
            </span>
          </div>

          {busy ? (
            <WorkspaceProgressBar
              percent={Math.min(100, Math.max(5, progress))}
              label={wsProgressPhase(ws, phase)}
            />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onConvert()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ws.wsText("convertLabel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              {ws.chooseAnotherFile}
            </button>
          </div>
        </div>
      )}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? ws.wsStatus("tryAgain") : "");
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
        label={file ? ws.wsText("convertLabel") : ws.wsText("stickyConvertLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
