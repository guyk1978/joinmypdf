"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  applyPdfMetadataUpdate,
  EMPTY_PDF_METADATA_FORM,
  PDF_METADATA_FORM_FIELDS,
  pdfMetadataEditorOutputName,
  readPdfMetadataForm,
  type PdfMetadataFormValues,
} from "@/lib/pdf-metadata-editor";
import * as pdf from "@/lib/pdf-engine";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function PdfMetadataEditorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<PdfMetadataFormValues>(EMPTY_PDF_METADATA_FORM);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setForm(EMPTY_PDF_METADATA_FORM);
    setPassword("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadMetadata = async (next: File, pwd: string) => {
    setLoading(true);
    setRunError(null);
    setStatus(ws.wsStatus("loading"));
    try {
      const values = await readPdfMetadataForm(next, { password: pwd.trim() || undefined });
      setForm(values);
      setStatus(ws.wsStatus("loaded", { name: next.name }));
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setForm(EMPTY_PDF_METADATA_FORM);
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }

    setFile(next);
    setDone(false);
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    await loadMetadata(next, password);
  };

  const onFieldChange =
    (key: keyof PdfMetadataFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
      setDone(false);
    };

  const onReload = async () => {
    if (!file) return;
    await loadMetadata(file, password);
  };

  const onSave = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("saving"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await applyPdfMetadataUpdate(file, form, {
        password: password.trim() || undefined,
      });
      const outName = pdfMetadataEditorOutputName(file);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
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
  const canSave = Boolean(file) && !busy && !loading;

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
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{file ? pdf.formatBytes(file.size) : ""}</p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="protect-form__fields max-w-2xl space-y-4">
            <div>
              <label className="protect-form__label" htmlFor={`${baseId}-password`}>
                {ws.wsUi("passwordLabel")}{" "}
                <span className="font-normal text-black dark:text-neutral-200">{ws.wsUi("passwordHint")}</span>
              </label>
              <input
                id={`${baseId}-password`}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="protect-form__input"
                placeholder={ws.wsUi("passwordPlaceholder")}
                disabled={busy || loading}
              />
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-neutral-300 underline-offset-2 hover:underline"
                disabled={busy || loading}
                onClick={() => void onReload()}
              >
                {ws.wsUi("reload")}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">{ws.wsUi("formHeading")}</h3>
              <p className="text-xs leading-relaxed text-ink-muted">{ws.wsUi("formHint")}</p>

              {PDF_METADATA_FORM_FIELDS.map((field) => {
                const fieldId = `${baseId}-${field.key}`;
                const isKeywords = field.key === "keywords";
                const label = ws.wsUi(`fields.${field.key}`);

                return (
                  <div key={field.key}>
                    <label className="protect-form__label" htmlFor={fieldId}>
                      {label}
                    </label>
                    {isKeywords ? (
                      <textarea
                        id={fieldId}
                        rows={2}
                        value={form[field.key]}
                        onChange={onFieldChange(field.key)}
                        className="protect-form__input min-h-[4.5rem] resize-y"
                        placeholder={ws.wsUi("keywordsPlaceholder")}
                        disabled={busy || loading}
                      />
                    ) : (
                      <input
                        id={fieldId}
                        type="text"
                        value={form[field.key]}
                        onChange={onFieldChange(field.key)}
                        className="protect-form__input"
                        disabled={busy || loading}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!canSave} onClick={() => void onSave()} className={toolPrimaryBtn}>
              {done ? ws.wsText("saveAgainLabel") : ws.wsText("saveLabel")}
            </button>
            <button type="button" disabled={busy || loading} onClick={reset} className={toolSecondaryBtn}>
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy || loading}
              onClick={() => startNewUpload(reset)}
            />
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
            setStatus(file ? ws.wsText("adjustTryAgain") : "");
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
        label={ws.wsText("saveLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
