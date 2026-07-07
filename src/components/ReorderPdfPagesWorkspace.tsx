"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PageManageSortableGrid } from "@/components/PageManageSortableGrid";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import { loadPdfPageCount } from "@/lib/pdf-delete-pages";
import { reorderPdfOutputName } from "@/lib/pdf-pages";
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

export function ReorderPdfPagesWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setPageOrder([]);
    setPassword("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const picked = list[0];
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setDone(false);
      setRunError(null);
      setPassword("");

      try {
        const count = await loadPdfPageCount(bytes, password);
        setPageCount(count);
        setPageOrder(Array.from({ length: count }, (_, i) => i));
        setStatus(ws.wsStatus("loaded", { count }));
      } catch {
        setPageCount(0);
        setPageOrder([]);
        setStatus(ws.wsStatus("couldNotOpen"));
      }

      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
    },
    [password, tool.operation, ws],
  );

  const onDownload = async () => {
    if (!file || !fileBytes || busy || !pageOrder.length) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setStatus(ws.wsStatus("applying"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.reorderPdfPagesFile(file, pageOrder, password);
      const outName = reorderPdfOutputName(file.name);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), outName);
      setDone(true);
      setStatus(ws.wsStatus("downloaded", { name: outName }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
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

  const isDefaultOrder = pageOrder.every((value, index) => value === index);

  return (
    <div id="tool-workspace" className="tool-workspace--wide space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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
        ) : null}
      </WorkspaceUploadShell>

      {file ? (
          <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="truncate text-sm text-ink-muted">
                <span className="font-medium text-ink">{file.name}</span>
              </p>
              <button type="button" onClick={reset} disabled={busy} className={toolSecondaryBtn}>
                {ws.chooseAnotherFile}
              </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
            </div>

            {fileBytes && pageCount > 0 ? (
              <PageManageSortableGrid
                fileBytes={fileBytes}
                password={password}
                pageOrder={pageOrder}
                onPageOrderChange={setPageOrder}
                loadingLabel={ws.wsUi("loadingThumb")}
                pageLabel={(page) => ws.wsCommon("pageNumber", { page })}
                moveUpLabel={ws.wsUi("moveUp")}
                moveDownLabel={ws.wsUi("moveDown")}
                hint={ws.wsUi("reorderHint")}
              />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={toolPrimaryBtn}
                disabled={busy || !pageOrder.length || isDefaultOrder}
                onClick={() => void onDownload()}
              >
                {busy ? ws.wsText("applyingLabel") : ws.buttonLabel()}
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
            setStatus(ws.wsStatus("adjustFile"));
          }}
        />
      ) : status ? (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
      <StickyMobileCta
        href="#tool-workspace"
        label={ws.buttonLabel()}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
