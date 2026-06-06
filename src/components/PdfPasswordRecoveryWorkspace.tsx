"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import {
  DEFAULT_CHARSET,
  estimateRecoveryAttempts,
  formatAttemptCount,
  MAX_PASSWORD_LENGTH,
  recoveryOutputName,
  startPasswordRecovery,
  type CharsetOptions,
  type RecoverySession,
} from "@/lib/pdf-password-recovery";
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

export function PdfPasswordRecoveryWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [encrypted, setEncrypted] = useState(false);
  const [charset, setCharset] = useState<CharsetOptions>(DEFAULT_CHARSET);
  const [minLength, setMinLength] = useState(1);
  const [maxLength, setMaxLength] = useState(4);
  const [tryCommon, setTryCommon] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [foundPassword, setFoundPassword] = useState<string | null>(null);
  const [revealPassword, setRevealPassword] = useState(false);
  const [progress, setProgress] = useState({ tried: 0, total: 0 });
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [formError, setFormError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<RecoverySession | null>(null);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  const estimatedAttempts = estimateRecoveryAttempts(charset, minLength, maxLength, tryCommon);
  const progressPercent =
    progress.total > 0 ? Math.min(100, Math.round((progress.tried / progress.total) * 100)) : busy ? 5 : 0;

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      sessionRef.current?.cancel();
    };
  }, []);

  const reset = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    pdfBufferRef.current = null;
    setFile(null);
    setEncrypted(false);
    setStatus("");
    setBusy(false);
    setDone(false);
    setFoundPassword(null);
    setRevealPassword(false);
    setProgress({ tried: 0, total: 0 });
    setRunError(null);
    setFormError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

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
    setFoundPassword(null);
    setRunError(null);
    setFormError("");
    setStatus(ws.wsStatus("checking"));

    try {
      const buffer = await next.arrayBuffer();
      pdfBufferRef.current = buffer.slice(0);
      const isLocked = await pdf.isPdfEncrypted(next);
      setEncrypted(isLocked);
      setStatus(
        isLocked ? ws.wsStatus("fileReady", { name: next.name }) : ws.wsStatus("notEncrypted"),
      );
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setFile(null);
      pdfBufferRef.current = null;
    }
  };

  const onStart = () => {
    if (!file || !pdfBufferRef.current || busy) return;

    if (!encrypted) {
      setFormError(ws.wsStatus("notEncryptedForm"));
      return;
    }

    const charsetStr =
      (charset.lowercase ? "a" : "") +
      (charset.uppercase ? "A" : "") +
      (charset.digits ? "0" : "") +
      (charset.special ? "!" : "") +
      (charset.custom || "");
    if (!tryCommon && !charsetStr) {
      setFormError(ws.wsStatus("charsetRequired"));
      return;
    }
    if (minLength > maxLength) {
      setFormError(ws.wsStatus("lengthOrder"));
      return;
    }
    if (maxLength > MAX_PASSWORD_LENGTH) {
      setFormError(ws.wsStatus("maxLength", { max: MAX_PASSWORD_LENGTH }));
      return;
    }

    setFormError("");
    setRunError(null);
    setBusy(true);
    setDone(false);
    setFoundPassword(null);
    setProgress({ tried: 0, total: estimatedAttempts });
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    sessionRef.current?.cancel();
    const bufferCopy = pdfBufferRef.current.slice(0);

    sessionRef.current = startPasswordRecovery(
      bufferCopy,
      { charset, minLength, maxLength, tryCommon },
      {
        onProgress: (p) => {
          setProgress(p);
          setStatus(
            ws.wsStatus("progress", {
              tried: formatAttemptCount(p.tried),
              total: formatAttemptCount(p.total),
            }),
          );
        },
        onComplete: (result) => {
          sessionRef.current = null;
          setBusy(false);

          if (result.status === "found") {
            setFoundPassword(result.password);
            setDone(true);
            setProgress({ tried: result.tried, total: result.total });
            setStatus(
              result.password ? ws.wsStatus("found") : ws.wsStatus("foundEmpty"),
            );
            capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
            window.setTimeout(() => {
              dispatchToolComplete({ operation: tool.operation, slug });
            }, 400);
            return;
          }

          if (result.status === "not-found") {
            setStatus(ws.wsStatus("notFound", { tried: formatAttemptCount(result.tried) }));
            return;
          }

          if (result.status === "limit") {
            setStatus(ws.wsStatus("limit"));
            return;
          }

          setRunError(classifyPdfError(new Error(result.message)));
          setStatus("");
        },
      },
    );
  };

  const onStop = () => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    setBusy(false);
    setStatus(ws.wsStatus("stopped"));
  };

  const onDownloadUnlocked = async () => {
    if (!file || foundPassword === null) return;
    setBusy(true);
    try {
      const bytes = await pdf.unlockPdfFile(file, foundPassword);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), recoveryOutputName(file));
      capture(EVENTS.download_click, { operation: tool.operation, slug });
    } catch (e) {
      setRunError(classifyPdfError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleCharset = (key: keyof Pick<CharsetOptions, "lowercase" | "uppercase" | "digits" | "special">) => {
    setCharset((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showWorkspace = Boolean(file);
  const canStart = Boolean(file) && encrypted && !busy;

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div className="space-y-2 rounded-none border border-white/10 bg-white/[0.02] p-3 md:p-4">
          <div>
            <p className="text-sm font-semibold text-ink">{file?.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {file ? pdf.formatBytes(file.size) : ""}
              {encrypted ? ws.wsUi("encryptedBadge") : ws.wsUi("notEncryptedBadge")}
            </p>
          </div>

          <fieldset className="space-y-3" disabled={busy}>
            <legend className="text-sm font-semibold text-ink">{ws.wsUi("charsetHeading")}</legend>
            <div className="flex flex-wrap gap-3 text-sm text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={charset.lowercase}
                  onChange={() => toggleCharset("lowercase")}
                />
                a–z
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={charset.uppercase}
                  onChange={() => toggleCharset("uppercase")}
                />
                A–Z
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={charset.digits} onChange={() => toggleCharset("digits")} />
                0–9
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={charset.special} onChange={() => toggleCharset("special")} />
                {ws.wsUi("special")}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={tryCommon} onChange={() => setTryCommon((v) => !v)} />
                {ws.wsUi("tryCommon")}
              </label>
            </div>
            <label className="block text-xs text-ink-muted" htmlFor={`${baseId}-custom`}>
              {ws.wsUi("customChars")}
            </label>
            <input
              id={`${baseId}-custom`}
              type="text"
              className="protect-form__input max-w-md"
              value={charset.custom}
              onChange={(e) => setCharset((prev) => ({ ...prev, custom: e.target.value }))}
              placeholder={ws.wsUi("customPlaceholder")}
            />
          </fieldset>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm text-ink">
              <span className="font-medium">{ws.wsUi("minLength")}</span>
              <input
                type="number"
                min={1}
                max={MAX_PASSWORD_LENGTH}
                value={minLength}
                disabled={busy}
                onChange={(e) => setMinLength(Number(e.target.value) || 1)}
                className="protect-form__input mt-1 w-full"
              />
            </label>
            <label className="block text-sm text-ink">
              <span className="font-medium">{ws.wsUi("maxLength")}</span>
              <input
                type="number"
                min={1}
                max={MAX_PASSWORD_LENGTH}
                value={maxLength}
                disabled={busy}
                onChange={(e) => setMaxLength(Number(e.target.value) || 1)}
                className="protect-form__input mt-1 w-full"
              />
            </label>
          </div>

          <p className="text-xs text-ink-muted">
            {ws.wsUi("estimatedAttempts", { count: formatAttemptCount(estimatedAttempts) })}
          </p>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{ws.wsUi("workerProgress")}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-none bg-white/10">
                <div
                  className="h-full rounded-none bg-neutral-800 transition-all duration-300 dark:bg-neutral-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-black dark:text-neutral-200">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            {!busy ? (
              <button type="button" disabled={!canStart} onClick={onStart} className={toolPrimaryBtn}>
                {ws.wsText("startLabel")}
              </button>
            ) : (
              <button type="button" onClick={onStop} className={toolPrimaryBtn}>
                {ws.wsText("stopLabel")}
              </button>
            )}
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
          </div>

          {foundPassword !== null ? (
            <div className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 p-4">
              <p className="text-sm font-semibold text-ink">{ws.wsUi("recoveredPassword")}</p>
              <p className="mt-2 font-mono text-lg text-black dark:text-neutral-200">
                {revealPassword ? foundPassword || ws.wsUi("emptyPassword") : "••••••••"}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm font-medium text-black dark:text-neutral-200 hover:underline"
                  onClick={() => setRevealPassword((v) => !v)}
                >
                  {revealPassword ? ws.wsUi("hide") : ws.wsUi("reveal")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDownloadUnlocked()}
                  className="text-sm font-medium text-black dark:text-neutral-200 hover:underline"
                >
                  {ws.wsText("downloadUnlockedLabel")}
                </button>
              </div>
            </div>
          ) : null}
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
            setStatus(file ? ws.wsStatus("adjustOptions") : "");
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
