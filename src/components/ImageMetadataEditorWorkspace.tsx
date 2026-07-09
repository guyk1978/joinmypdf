"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageToolDropzone } from "@/components/ImageToolDropzone";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  applyImageMetadataUpdate,
  EMPTY_IMAGE_METADATA_FORM,
  IMAGE_METADATA_FORM_FIELDS,
  imageMetadataEditorOutputName,
  isAcceptedImageFile,
  readImageMetadataForm,
  stripImageMetadata,
  type ImageMetadataFormValues,
} from "@/lib/image-metadata-editor";
import { formatBytes } from "@/lib/pdf-to-word";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function ImageMetadataEditorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const t = useTranslations("ImageMetadataEditor");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<ImageMetadataFormValues>(EMPTY_IMAGE_METADATA_FORM);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, file ? 1 : 0);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setForm(EMPTY_IMAGE_METADATA_FORM);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadMetadata = async (next: File) => {
    setLoading(true);
    setRunError(null);
    setStatus(ws.wsStatus("loading"));
    try {
      const values = await readImageMetadataForm(next);
      setForm(values);
      setStatus(ws.wsStatus("loaded", { name: next.name }));
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setForm(EMPTY_IMAGE_METADATA_FORM);
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async (next: File) => {
    if (!isAcceptedImageFile(next)) {
      setStatus(ws.wsStatus("noImages"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }

    setFile(next);
    setDone(false);
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    await loadMetadata(next);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming || []).filter(isAcceptedImageFile);
    if (!accepted.length) {
      setStatus(ws.wsStatus("noImages"));
      return;
    }
    void pickFile(accepted[0]);
  };

  const onFieldChange =
    (key: keyof ImageMetadataFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
      setDone(false);
    };

  const onReload = async () => {
    if (!file) return;
    await loadMetadata(file);
  };

  const onSave = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("saving"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const blob = await applyImageMetadataUpdate(file, form);
      const outName = imageMetadataEditorOutputName(file);
      downloadBlob(blob, outName);
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

  const onStrip = async () => {
    if (!file || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("stripping"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, mode: "strip" });

    try {
      const blob = await stripImageMetadata(file);
      const outName = imageMetadataEditorOutputName(file, true);
      downloadBlob(blob, outName);
      setDone(true);
      setStatus(ws.wsStatus("stripped", { name: outName }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, mode: "strip" });
      capture(EVENTS.download_click, { operation: tool.operation, slug, mode: "strip" });
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
      <WorkspaceUploadShell>
        {!showWorkspace ? (
          <>
            <ImageToolDropzone
              dropTitle={t("dropTitle")}
              selectLabel={t("selectFile")}
              selectAria={t("selectFileAria")}
              dropHint={t("dropHint")}
              supportedFormats={["JPG", "PNG", "WEBP", "HEIC", "GIF"]}
              accept={ACCEPT}
              multiple={false}
              disabled={busy || loading}
              onFiles={addFiles}
            />
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={ACCEPT}
              disabled={busy || loading}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
      </WorkspaceUploadShell>

      {showWorkspace ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file?.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{file ? formatBytes(file.size) : ""}</p>
            </div>
            <span className="rounded-none border border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-black dark:text-neutral-200">
              {ws.clientSideOnly}
            </span>
          </div>

          <div className="protect-form__fields max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                  {ws.wsUi("formHeading")}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{ws.wsUi("formHint")}</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-neutral-300 underline-offset-2 hover:underline"
                disabled={busy || loading}
                onClick={() => void onReload()}
              >
                {ws.wsUi("reload")}
              </button>
            </div>

            {IMAGE_METADATA_FORM_FIELDS.map((field) => {
              const fieldId = `${baseId}-${field.key}`;
              const isComment = field.key === "comment";
              const label = ws.wsUi(`fields.${field.key}`);

              return (
                <div key={field.key}>
                  <label className="protect-form__label" htmlFor={fieldId}>
                    {label}
                  </label>
                  {isComment ? (
                    <textarea
                      id={fieldId}
                      rows={2}
                      value={form[field.key]}
                      onChange={onFieldChange(field.key)}
                      className="protect-form__input min-h-[4.5rem] resize-y"
                      placeholder={ws.wsUi("commentPlaceholder")}
                      disabled={busy || loading}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      type="text"
                      value={form[field.key]}
                      onChange={onFieldChange(field.key)}
                      className="protect-form__input"
                      placeholder={ws.wsUi(`placeholders.${field.key}`)}
                      disabled={busy || loading}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!canSave} onClick={() => void onSave()} className={toolPrimaryBtn}>
              {done ? ws.wsText("saveAgainLabel") : ws.wsText("saveLabel")}
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void onStrip()}
              className={toolSecondaryBtn}
            >
              {ws.wsText("stripLabel")}
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
