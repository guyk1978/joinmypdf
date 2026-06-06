"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import { toolPanel, toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function protectOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-protected.pdf`;
}

export function ProtectPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
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
    setPassword("");
    setConfirmPassword("");
    setStatus("");
    setFormError("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      setFile(list[0]);
      setDone(false);
      setRunError(null);
      setFormError("");
      setStatus("PDF ready — set a password below.");
      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;

    setFormError("");
    setRunError(null);

    if (!password.trim()) {
      setFormError("Enter a password.");
      return;
    }
    if (password.length < 4) {
      setFormError("Use a password with at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setDone(false);
    setStatus("Encrypting your PDF…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.protectPdfFile(file, password);
      const outName = protectOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(`Protected PDF downloaded as ${outName}.`);
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

  const canSubmit = Boolean(file) && !busy && password.length > 0 && confirmPassword.length > 0;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Private:</strong> Your file is encrypted locally in your browser and never touches our
        servers.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop a PDF here or click to browse"
        description="Select one PDF to password-protect. Processing stays on your device."
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
          addFile(e.dataTransfer.files);
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
              if (e.target.files?.length) addFile(e.target.files);
              e.target.value = "";
            }}
          />
        }
      />

      {file ? (
        <div className={toolPanel}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Selected file</p>
          <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">{file.name}</span> ·{" "}
            {pdf.formatBytes(file.size)}
          </p>
        </div>
      ) : null}

      {file ? (
        <form className="protect-form" onSubmit={onSubmit} noValidate>
          <div className="protect-form__fields">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              Password
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="new-password"
              className="protect-form__input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Enter password"
              disabled={busy}
            />

            <label className="protect-form__label" htmlFor={`${baseId}-confirm`}>
              Confirm password
            </label>
            <input
              id={`${baseId}-confirm`}
              type="password"
              autoComplete="new-password"
              className="protect-form__input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Re-enter password"
              disabled={busy}
            />
          </div>

          {formError ? (
            <p className="protect-form__error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-protect relative ${toolPrimaryBtn}`}
            >
              {busy ? (
                <>
                  <span className="tool-spinner" aria-hidden="true" />
                  <span>Protecting…</span>
                </>
              ) : (
                "Protect PDF"
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className={`${toolSecondaryBtn} disabled:opacity-50`}
            >{ws.clear}</button>
          </div>
        </form>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus("Adjust your file or password and try again.");
          }}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label="Protect PDF" secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
