"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import type { ToolDefinition } from "@/lib/types";
import * as pdf from "@/lib/pdf-engine";
import { IncorrectPasswordError } from "@/lib/pdf-unlock";
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

function unlockOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-unlocked.pdf`;
}

export function UnlockPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
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
    setEncrypted(false);
    setStatus("");
    setFormError("");
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
      setFile(picked);
      setDone(false);
      setRunError(null);
      setFormError("");
      setPassword("");

      try {
        const isLocked = await pdf.isPdfEncrypted(picked);
        setEncrypted(isLocked);
        setStatus(
          isLocked
            ? "This PDF is password-protected — enter the current password below."
            : "PDF ready. Enter a password only if the file prompts for one when opened.",
        );
      } catch {
        setEncrypted(false);
        setStatus("PDF ready — enter the password if needed, then unlock.");
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [acceptPdf, tool.operation],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;

    setFormError("");
    setRunError(null);

    if (encrypted && !password) {
      setFormError("Enter the current PDF password.");
      return;
    }

    setBusy(true);
    setDone(false);
    setStatus("Removing password protection…");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.unlockPdfFile(file, password);
      const outName = unlockOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(`Unlocked PDF downloaded as ${outName}.`);
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => {
        dispatchToolComplete({ operation: tool.operation, slug });
      }, 400);
    } catch (e) {
      if (e instanceof IncorrectPasswordError) {
        setFormError(e.message);
        setStatus("");
        capture(EVENTS.tool_run_error, {
          operation: tool.operation,
          slug,
          message: e.message,
          kind: "wrong_password",
        });
        return;
      }
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

  const canSubmit = Boolean(file) && !busy && (!encrypted || password.length > 0);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Password decryption happens locally in your browser. We never store
        or see your passwords or files.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop a password-protected PDF here or click to browse"
        description="Select one PDF to unlock. Processing stays on your device."
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

      {file ? (
        <div className={toolPanel}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Selected file</p>
          <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">{file.name}</span> ·{" "}
            {pdf.formatBytes(file.size)}
            {encrypted ? (
              <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                Password protected
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      {file ? (
        <form className="protect-form" onSubmit={onSubmit} noValidate>
          <div className="protect-form__fields">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              Current PDF password
            </label>
            <input
              id={`${baseId}-password`}
              type="password"
              autoComplete="current-password"
              className="protect-form__input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              placeholder={encrypted ? "Enter password to open this PDF" : "Leave blank if not required"}
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
                  <span>Unlocking…</span>
                </>
              ) : (
                "Unlock PDF"
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
        <p className="text-sm text-slate-600 dark:text-slate-400" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label="Unlock PDF" secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
