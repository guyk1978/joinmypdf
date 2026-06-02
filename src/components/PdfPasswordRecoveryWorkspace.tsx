"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
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
      setStatus("Please choose a PDF file.");
      return;
    }
    if (next.size === 0) {
      setStatus("That file is empty. Choose another PDF.");
      return;
    }

    setFile(next);
    setDone(false);
    setFoundPassword(null);
    setRunError(null);
    setFormError("");
    setStatus("Checking encryption...");

    try {
      const buffer = await next.arrayBuffer();
      pdfBufferRef.current = buffer.slice(0);
      const isLocked = await pdf.isPdfEncrypted(next);
      setEncrypted(isLocked);
      setStatus(
        isLocked
          ? `${next.name} ready — configure options below, then start recovery.`
          : "This PDF does not appear to be password-protected. Recovery is only for locked files.",
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
      setFormError("This PDF does not look encrypted. Use Unlock PDF if you already know the password.");
      return;
    }

    const charsetStr =
      (charset.lowercase ? "a" : "") +
      (charset.uppercase ? "A" : "") +
      (charset.digits ? "0" : "") +
      (charset.special ? "!" : "") +
      (charset.custom || "");
    if (!tryCommon && !charsetStr) {
      setFormError("Select at least one character set or enable common passwords.");
      return;
    }
    if (minLength > maxLength) {
      setFormError("Minimum length cannot exceed maximum length.");
      return;
    }
    if (maxLength > MAX_PASSWORD_LENGTH) {
      setFormError(`Maximum length is ${MAX_PASSWORD_LENGTH} for browser recovery.`);
      return;
    }

    setFormError("");
    setRunError(null);
    setBusy(true);
    setDone(false);
    setFoundPassword(null);
    setProgress({ tried: 0, total: estimatedAttempts });
    setStatus("Recovering password in a background worker — your file never leaves this browser.");
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
            `Trying passwords… ${formatAttemptCount(p.tried)} of ~${formatAttemptCount(p.total)} attempts`,
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
              result.password
                ? "Password found. You can reveal it below and download an unlocked copy."
                : "Password found (empty password). Download the unlocked PDF below.",
            );
            capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
            window.setTimeout(() => {
              dispatchToolComplete({ operation: tool.operation, slug });
            }, 400);
            return;
          }

          if (result.status === "not-found") {
            setStatus(
              `No match in ~${formatAttemptCount(result.tried)} attempts. Try a wider character set or longer max length.`,
            );
            return;
          }

          if (result.status === "limit") {
            setStatus("Attempt limit reached. Narrow the search or use Unlock PDF if you remember the password.");
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
    setStatus("Recovery stopped.");
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
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>Your file never leaves your browser.</strong> Brute-force runs in a local Web Worker on your
        device. Use only on PDFs you own or may legally access. Best for short, simple forgotten passwords.
      </div>

      {!showWorkspace ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a protected PDF here or click to browse"
          description="Recover short passwords locally — no cloud upload."
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
          <div>
            <p className="text-sm font-semibold text-ink">{file?.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {file ? pdf.formatBytes(file.size) : ""}
              {encrypted ? " · Password-protected" : " · Not encrypted"}
            </p>
          </div>

          <fieldset className="space-y-3" disabled={busy}>
            <legend className="text-sm font-semibold text-ink">Character sets to try</legend>
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
                Special
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={tryCommon} onChange={() => setTryCommon((v) => !v)} />
                Common passwords first
              </label>
            </div>
            <label className="block text-xs text-ink-muted" htmlFor={`${baseId}-custom`}>
              Extra characters (optional)
            </label>
            <input
              id={`${baseId}-custom`}
              type="text"
              className="protect-form__input max-w-md"
              value={charset.custom}
              onChange={(e) => setCharset((prev) => ({ ...prev, custom: e.target.value }))}
              placeholder="e.g. #@"
            />
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-ink">
              <span className="font-medium">Minimum length</span>
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
              <span className="font-medium">Maximum length</span>
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
            Estimated search space: ~{formatAttemptCount(estimatedAttempts)} attempts (capped for browser
            safety).
          </p>

          {busy ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Recovery in progress (Web Worker)</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            {!busy ? (
              <button type="button" disabled={!canStart} onClick={onStart} className={toolPrimaryBtn}>
                Start recovery
              </button>
            ) : (
              <button type="button" onClick={onStop} className={toolPrimaryBtn}>
                Stop
              </button>
            )}
            <button type="button" disabled={busy} onClick={reset} className={toolSecondaryBtn}>
              Choose another file
            </button>
          </div>

          {foundPassword !== null ? (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
              <p className="text-sm font-semibold text-ink">Recovered password</p>
              <p className="mt-2 font-mono text-lg text-brand">
                {revealPassword ? foundPassword || "(empty)" : "••••••••"}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm font-medium text-brand hover:underline"
                  onClick={() => setRevealPassword((v) => !v)}
                >
                  {revealPassword ? "Hide" : "Reveal"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDownloadUnlocked()}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Download unlocked PDF
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
            setStatus(file ? "Adjust options and try again." : "");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label="Start recovery" secondaryHref="/" secondaryLabel="Home" />
    </div>
  );
}
