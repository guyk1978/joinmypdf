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
            ? ws.status("lockedReady")
            : ws.status("unlockedReady"),
        );
      } catch {
        setEncrypted(false);
        setStatus(ws.status("fallbackReady"));
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
      setFormError(ws.status("passwordRequired"));
      return;
    }

    setBusy(true);
    setDone(false);
    setStatus(ws.status("unlocking"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.unlockPdfFile(file, password);
      const outName = unlockOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.status("complete", { name: outName }));
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
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>{ws.securePrefix}</strong> {ws.wsText("privacyNote")}
      </div>

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

      {file ? (
        <div className={toolPanel}>
          <p className="text-sm font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{ws.wsUi("selectedFile")}</p>
          <p className="mt-2 truncate text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
            <span className="font-medium text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{file.name}</span> ·{" "}
            {pdf.formatBytes(file.size)}
            {encrypted ? (
              <span className="ms-2 rounded-none bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-black dark:text-neutral-200 dark:bg-neutral-200 dark:bg-neutral-800 dark:text-black dark:text-neutral-200">
                {ws.wsUi("passwordProtectedBadge")}
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      {file ? (
        <form className="protect-form" onSubmit={onSubmit} noValidate>
          <div className="protect-form__fields">
            <label className="protect-form__label" htmlFor={`${baseId}-password`}>
              {ws.wsUi("passwordLabel")}
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
              placeholder={encrypted ? ws.wsUi("passwordPlaceholderLocked") : ws.wsUi("passwordPlaceholderUnlocked")}
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
                  <span>{ws.wsText("unlockingLabel")}</span>
                </>
              ) : (
                ws.wsText("unlockLabel")
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
            setStatus(ws.status("adjustTryAgain"));
          }}
        />
      ) : (
        <p className="text-sm text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta href="#tool-workspace" label={ws.wsText("unlockLabel")} secondaryHref="/" secondaryLabel={ws.home} />
    </div>
  );
}
