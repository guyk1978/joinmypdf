"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  batchRenameZipName,
  buildRenamePreview,
  DEFAULT_BATCH_RENAME_RULES,
  type BatchRenameRules,
} from "@/lib/pdf-batch-rename";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { zipBlobs } from "@/lib/zip-blobs";
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

export function BatchRenamePdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [files, setFiles] = useState<File[]>([]);
  const [rules, setRules] = useState<BatchRenameRules>(DEFAULT_BATCH_RENAME_RULES);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  const preview = useMemo(() => (files.length ? buildRenamePreview(files, rules) : []), [files, rules]);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFiles([]);
    setRules(DEFAULT_BATCH_RENAME_RULES);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const accepted = Array.from(incoming || []).filter(acceptPdf);
      if (!accepted.length) {
        setStatus("No PDF files detected.");
        return;
      }
      setFiles((prev) => {
        const map = new Map(prev.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f]));
        for (const file of accepted) {
          map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
        }
        return Array.from(map.values());
      });
      setDone(false);
      setRunError(null);
      setStatus(`Added ${accepted.length} PDF file(s). Adjust rules and preview new names below.`);
      capture(EVENTS.file_selected, { operation: tool.operation, count: accepted.length });
    },
    [acceptPdf, tool.operation],
  );

  const onRenameAndDownload = async () => {
    if (!files.length || busy) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus("Packaging renamed PDFs into a ZIP archive...");
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const rows = buildRenamePreview(files, rules);
      const entries = rows.map((row) => ({ name: row.newName, blob: row.file }));
      const zip = await zipBlobs(entries);
      downloadBlob(zip, batchRenameZipName());
      setDone(true);
      setStatus(`Downloaded ${rows.length} renamed PDF(s) as a ZIP file.`);
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, count: rows.length });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "zip" });
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

  const showWorkspace = files.length > 0;
  const canDownload = files.length > 0 && !busy;

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>Your files never leave your browser.</strong> Renaming uses the File API locally and
        downloads a ZIP from this device—no upload to JoinMyPDF servers.
      </div>

      <FileUploadZone
        drag={drag}
        role="button"
        tabIndex={0}
        aria-controls={`${baseId}-input`}
        className="cursor-pointer"
        title="Drop PDF files or a folder here"
        description="Select multiple PDFs or an entire folder. Files stay on your device."
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
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        input={
          <>
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              className="sr-only"
              accept="application/pdf,.pdf"
              multiple
              // @ts-expect-error webkitdirectory is supported in Chromium-based browsers
              webkitdirectory=""
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={toolSecondaryBtn}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Add PDF files
        </button>
        <button
          type="button"
          className={toolSecondaryBtn}
          onClick={(e) => {
            e.stopPropagation();
            folderInputRef.current?.click();
          }}
        >
          Add folder
        </button>
        {files.length ? (
          <button type="button" className={toolSecondaryBtn} onClick={reset}>
            Clear all
          </button>
        ) : null}
      </div>

      {showWorkspace ? (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <p className="text-sm text-ink-muted">
            {files.length} file{files.length === 1 ? "" : "s"} selected · sorted alphabetically for
            numbering
          </p>

          <section className="space-y-4" aria-labelledby={`${baseId}-rules`}>
            <h2 id={`${baseId}-rules`} className="text-sm font-semibold text-ink">
              Rename rules
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-ink">
                <span className="font-medium">Text prefix</span>
                <input
                  type="text"
                  className="protect-form__input mt-1 w-full"
                  value={rules.prefix}
                  disabled={busy}
                  onChange={(e) => setRules((r) => ({ ...r, prefix: e.target.value }))}
                  placeholder="e.g. Report"
                />
              </label>
              <label className="block text-sm text-ink">
                <span className="font-medium">Text suffix</span>
                <input
                  type="text"
                  className="protect-form__input mt-1 w-full"
                  value={rules.suffix}
                  disabled={busy}
                  onChange={(e) => setRules((r) => ({ ...r, suffix: e.target.value }))}
                  placeholder="e.g. final"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rules.useDatePrefix}
                  disabled={busy}
                  onChange={(e) => setRules((r) => ({ ...r, useDatePrefix: e.target.checked }))}
                />
                Date prefix (YYYY-MM-DD)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rules.numbering.enabled}
                  disabled={busy}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      numbering: { ...r.numbering, enabled: e.target.checked },
                    }))
                  }
                />
                Sequential numbering
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rules.lowercase}
                  disabled={busy}
                  onChange={(e) => setRules((r) => ({ ...r, lowercase: e.target.checked }))}
                />
                Lowercase names
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rules.spacesToDashes}
                  disabled={busy}
                  onChange={(e) => setRules((r) => ({ ...r, spacesToDashes: e.target.checked }))}
                />
                Spaces → dashes
              </label>
            </div>

            {rules.numbering.enabled ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-ink">
                  <span className="font-medium">Start at</span>
                  <input
                    type="number"
                    min={0}
                    className="protect-form__input mt-1 w-full"
                    value={rules.numbering.start}
                    disabled={busy}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        numbering: { ...r.numbering, start: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-ink">
                  <span className="font-medium">Digits</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="protect-form__input mt-1 w-full"
                    value={rules.numbering.padding}
                    disabled={busy}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        numbering: {
                          ...r.numbering,
                          padding: Math.min(6, Math.max(1, Number(e.target.value) || 1)),
                        },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-ink">
                  <span className="font-medium">Number separator</span>
                  <input
                    type="text"
                    className="protect-form__input mt-1 w-full"
                    value={rules.numbering.separator}
                    disabled={busy}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        numbering: { ...r.numbering, separator: e.target.value },
                      }))
                    }
                    placeholder="-"
                  />
                </label>
              </div>
            ) : null}

            <fieldset className="space-y-2 rounded-xl border border-white/10 p-4">
              <legend className="text-sm font-medium text-ink">Find & replace in filename</legend>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={rules.replace.enabled}
                  disabled={busy}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      replace: { ...r.replace, enabled: e.target.checked },
                    }))
                  }
                />
                Enable text replacement
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  className="protect-form__input w-full"
                  placeholder="Find"
                  disabled={busy || !rules.replace.enabled}
                  value={rules.replace.find}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      replace: { ...r.replace, find: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  className="protect-form__input w-full"
                  placeholder="Replace with"
                  disabled={busy || !rules.replace.enabled}
                  value={rules.replace.replaceWith}
                  onChange={(e) =>
                    setRules((r) => ({
                      ...r,
                      replace: { ...r.replace, replaceWith: e.target.value },
                    }))
                  }
                />
              </div>
            </fieldset>
          </section>

          <section aria-labelledby={`${baseId}-preview`}>
            <h2 id={`${baseId}-preview`} className="text-sm font-semibold text-ink">
              Preview
            </h2>
            <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-start text-sm">
                <thead className="sticky top-0 bg-slate-900/95 text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Original</th>
                    <th className="px-4 py-2 font-medium">New name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {preview.map((row) => (
                    <tr key={`${row.originalName}-${row.newName}`}>
                      <td className="px-4 py-2 text-ink-muted">{row.originalName}</td>
                      <td className="px-4 py-2 font-medium text-brand">{row.newName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <button
            type="button"
            disabled={!canDownload}
            onClick={() => void onRenameAndDownload()}
            className={toolPrimaryBtn}
          >
            Rename & download all (ZIP)
          </button>
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
            setStatus(files.length ? "Adjust rules and try again." : "");
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
        label="Rename & download"
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
