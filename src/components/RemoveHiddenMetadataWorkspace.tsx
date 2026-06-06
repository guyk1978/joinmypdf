"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import {
  cleanPdfMetadata,
  cleanPdfMetadataOutputName,
  readPdfMetadata,
  type PdfMetadataEntry,
} from "@/lib/pdf-remove-metadata";
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
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function RemoveHiddenMetadataWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadataEntry[] | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setMetadata(null);
    setPassword("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const scanFile = async (next: File, pwd: string) => {
    setScanning(true);
    setMetadata(null);
    setRunError(null);
    setStatus(ws.wsStatus("scanning"));
    try {
      const found = await readPdfMetadata(next, { password: pwd.trim() || undefined });
      setMetadata(found);
      setStatus(
        found.length
          ? ws.wsStatus("found", { count: found.length })
          : ws.wsStatus("noneDetected"),
      );
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setMetadata(null);
    } finally {
      setScanning(false);
    }
  };

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsCommon("choosePdf"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsCommon("emptyPdf"));
      return;
    }

    setFile(next);
    setDone(false);
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    await scanFile(next, password);
  };

  const onRescan = async () => {
    if (!file) return;
    await scanFile(file, password);
  };

  const onClean = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("removing"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await cleanPdfMetadata(file, { password: password.trim() || undefined });
      const outName = cleanPdfMetadataOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setMetadata([]);
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

  const showWorkspace = Boolean(file);
  const canClean = Boolean(file) && !busy && !scanning;
  const foundCount = metadata?.length ?? 0;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {ws.wsText("privacyNote")}
      </div>

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
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}

      {showWorkspace ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{file ? pdf.formatBytes(file.size) : ""}</p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="protect-form__fields max-w-md">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              {ws.wsUi("passwordLabel")}
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="protect-form__input"
              placeholder={ws.wsUi("passwordPlaceholder")}
              disabled={busy || scanning}
            />
            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand hover:underline disabled:opacity-50"
              disabled={busy || scanning}
              onClick={() => void onRescan()}
            >
              {ws.wsUi("rescan")}
            </button>
          </div>

          <section aria-labelledby={`${baseId}-metadata-heading`}>
            <h2 id={`${baseId}-metadata-heading`} className="text-sm font-semibold text-ink">
              {ws.wsUi("metadataHeading")}
            </h2>
            {scanning ? (
              <p className="mt-2 text-sm text-ink-muted">{ws.wsUi("scanningInline")}</p>
            ) : foundCount > 0 ? (
              <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03]">
                {metadata!.map((entry) => (
                  <li key={entry.key} className="px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{entry.label}</p>
                    <p className="mt-1 break-words text-sm text-ink">{entry.value}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{ws.wsUi("noInfoFields")}</p>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!canClean} onClick={() => void onClean()} className={toolPrimaryBtn}>
              {done ? ws.wsText("cleanAgainLabel") : ws.wsText("cleanLabel")}
            </button>
            <button type="button" disabled={busy || scanning} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
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
            setStatus(file ? ws.wsStatus("adjustTryAgain") : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={ws.wsText("stickyLabel")} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
