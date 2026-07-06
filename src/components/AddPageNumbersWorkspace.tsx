"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone"
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  PAGE_NUMBER_COLOR_OPTIONS,
  type AddPageNumbersOptions,
  type PageNumberFontColor,
  type PageNumberFontSize,
  type PageNumberFormat,
  type PageNumberPosition,
} from "@/lib/add-page-numbers";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import { pageNumberColorLabel, pageNumberPositionLabel } from "@/lib/workspace-preset-i18n";
import * as pdf from "@/lib/pdf-engine";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
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

const PAGE_NUMBER_POSITIONS: PageNumberPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const FONT_SIZES: { value: PageNumberFontSize; hintKey: "sizeHintSmall" | "sizeHintMedium" | "sizeHintLarge" }[] = [
  { value: "small", hintKey: "sizeHintSmall" },
  { value: "medium", hintKey: "sizeHintMedium" },
  { value: "large", hintKey: "sizeHintLarge" },
];

export function AddPageNumbersWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startPage, setStartPage] = useState(1);
  const [format, setFormat] = useState<PageNumberFormat>("number");
  const [fontSize, setFontSize] = useState<PageNumberFontSize>("medium");
  const [fontColorHex, setFontColorHex] = useState<PageNumberFontColor>("#000000");
  const [isBold, setIsBold] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
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
    setPageCount(0);
    setPosition("bottom-center");
    setStartPage(1);
    setFormat("number");
    setFontSize("medium");
    setFontColorHex("#000000");
    setIsBold(false);
    setFormError("");
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const loadPageCount = async (next: File) => {
    const pdfjs = await import("pdfjs-dist");
    const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    const url = URL.createObjectURL(next);
    try {
      const doc = await pdfjs.getDocument({ url }).promise;
      setPageCount(doc.numPages);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter(acceptPdf);
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }
      const next = list[0];
      setFile(next);
      setDone(false);
      setRunError(null);
      setFormError("");
      setStartPage(1);
      setStatus(ws.wsCommon("loadingPdf"));
      try {
        await loadPageCount(next);
        setStatus(ws.wsStatus("fileReady"));
        capture(EVENTS.file_selected, { count: 1, operation: tool.operation });
      } catch (e) {
        const parsed = classifyPdfError(e);
        setRunError(parsed);
        setStatus("");
        setFile(null);
        setPageCount(0);
      }
    },
    [acceptPdf, tool.operation, ws],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;

    setFormError("");
    setRunError(null);

    const start = Math.floor(startPage);
    if (!Number.isFinite(start) || start < 1) {
      setFormError(ws.wsStatus("startMin"));
      return;
    }
    if (pageCount && start > pageCount) {
      setFormError(ws.wsStatus("startMax", { pageCount }));
      return;
    }

    const options: AddPageNumbersOptions = {
      position,
      startPage: start,
      format,
      fontSize,
      fontColorHex,
      isBold,
    };

    setBusy(true);
    setDone(false);
    setStatus(ws.wsStatus("adding"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const bytes = await pdf.addPageNumbersFile(file, options);
      const outName = pdf.addPageNumbersOutputName(file);
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

  const showOptions = Boolean(file);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
            {!showOptions ? (
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
              className="sr-only"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                if (e.target.files?.length) void addFile(e.target.files);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}
      </WorkspaceUploadShell>

      {showOptions ? (
        <form id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-2" onSubmit={onSubmit}>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">{file?.name}</strong>
            {pageCount ? ` · ${formatPageCount(ws, pageCount)}` : null}
          </p>

          <div className="page-numbers-form rounded-none border border-white/10 bg-white/[0.03] p-4 md:p-3">
            <div className="page-numbers-form__row">
              <label className="page-numbers-form__label" htmlFor={`${baseId}-position`}>
                {ws.wsUi("positionLabel")}
              </label>
              <select
                id={`${baseId}-position`}
                className="page-numbers-form__select"
                value={position}
                onChange={(e) => setPosition(e.target.value as PageNumberPosition)}
                disabled={busy}
              >
                {PAGE_NUMBER_POSITIONS.map((value) => (
                  <option key={value} value={value}>
                    {pageNumberPositionLabel(ws, value)}
                  </option>
                ))}
              </select>
            </div>

            <div className="page-numbers-form__row">
              <label className="page-numbers-form__label" htmlFor={`${baseId}-start`}>
                {ws.wsUi("startLabel")}
              </label>
              <input
                id={`${baseId}-start`}
                className="page-numbers-form__input"
                type="number"
                min={1}
                max={pageCount || undefined}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                disabled={busy}
              />
            </div>

            <fieldset className="page-numbers-form__fieldset">
              <legend className="page-numbers-form__label">{ws.wsUi("formatLabel")}</legend>
              <label className="page-numbers-form__radio">
                <input
                  type="radio"
                  name={`${baseId}-format`}
                  value="number"
                  checked={format === "number"}
                  onChange={() => setFormat("number")}
                  disabled={busy}
                />
                <span>{ws.wsUi("formatNumber")}</span>
              </label>
              <label className="page-numbers-form__radio">
                <input
                  type="radio"
                  name={`${baseId}-format`}
                  value="page-of"
                  checked={format === "page-of"}
                  onChange={() => setFormat("page-of")}
                  disabled={busy}
                />
                <span>{ws.wsUi("formatPageOf")}</span>
              </label>
            </fieldset>

            <div className="page-numbers-form__row">
              <span className="page-numbers-form__label" id={`${baseId}-size-label`}>
                {ws.wsUi("fontSizeLabel")}
              </span>
              <div className="page-numbers-form__choices" role="group" aria-labelledby={`${baseId}-size-label`}>
                {FONT_SIZES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`page-numbers-form__choice${fontSize === opt.value ? " is-active" : ""}`}
                    aria-pressed={fontSize === opt.value}
                    disabled={busy}
                    onClick={() => setFontSize(opt.value)}
                  >
                    {opt.value === "small"
                      ? ws.wsUi("sizeSmall")
                      : opt.value === "medium"
                        ? ws.wsUi("sizeMedium")
                        : ws.wsUi("sizeLarge")}
                    <span className="page-numbers-form__choice-hint">{ws.wsUi(opt.hintKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="page-numbers-form__row">
              <span className="page-numbers-form__label" id={`${baseId}-color-label`}>
                {ws.wsUi("fontColorLabel")}
              </span>
              <div className="page-numbers-form__swatches" role="group" aria-labelledby={`${baseId}-color-label`}>
                {PAGE_NUMBER_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`page-numbers-form__swatch${fontColorHex === opt.value ? " is-active" : ""}`}
                    style={{ backgroundColor: opt.value }}
                    title={pageNumberColorLabel(ws, opt.value)}
                    aria-label={pageNumberColorLabel(ws, opt.value)}
                    aria-pressed={fontColorHex === opt.value}
                    disabled={busy}
                    onClick={() => setFontColorHex(opt.value)}
                  />
                ))}
              </div>
            </div>

            <div className="page-numbers-form__row">
              <span className="page-numbers-form__label" id={`${baseId}-style-label`}>
                {ws.wsUi("fontStyleLabel")}
              </span>
              <div className="page-numbers-form__choices" role="group" aria-labelledby={`${baseId}-style-label`}>
                <button
                  type="button"
                  className={`page-numbers-form__choice${!isBold ? " is-active" : ""}`}
                  aria-pressed={!isBold}
                  disabled={busy}
                  onClick={() => setIsBold(false)}
                >
                  {ws.wsUi("styleRegular")}
                </button>
                <button
                  type="button"
                  className={`page-numbers-form__choice page-numbers-form__choice--bold${isBold ? " is-active" : ""}`}
                  aria-pressed={isBold}
                  disabled={busy}
                  onClick={() => setIsBold(true)}
                >
                  {ws.wsUi("styleBold")}
                </button>
              </div>
            </div>

            {formError ? (
              <p className="page-numbers-form__error" role="alert">
                {formError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ws.wsText("addLabel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-none border border-white/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-white/5"
            >
              {ws.chooseAnotherFile}
            </button>
            <WorkspaceNewUploadButton
              label={ws.uploadNewFile}
              disabled={busy}
              onClick={() => startNewUpload(reset)}
            />
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
            setStatus(file ? ws.wsStatus("adjustOptions") : "");
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
        label={ws.wsText("addLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
