"use client";

import dynamic from "next/dynamic";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PdfEditStudio, PdfStudioPage } from "@/components/PdfEditStudio";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import {
  loadOriginalPageSizes,
  pdfEditorOutputName,
} from "@/lib/pdf-editor";
import { exportPdfEditorViaHtmlSnapshot } from "@/lib/pdf-editor-snapshot-export";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import * as pdf from "@/lib/pdf-engine";
import {
  PDF_EDITOR_OCR_LANGUAGES,
  ocrTextToHtml,
  renderPdfPageForOcr,
  runSinglePageOcrInWorker,
} from "@/lib/pdf-ocr";
import { loadPdfPageCount, REDACT_UI_SCALE, renderPdfPageForUi } from "@/lib/pdf-redact";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type EditorState =
  | "idle"
  | "parsing"
  | "ocr_running"
  | "ocr_complete"
  | "editor_ready"
  | "error";

type PageDoc = {
  html: string;
  json: Record<string, unknown>;
  status: "empty" | "ready" | "error";
};

const EMPTY_JSON: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function PdfEditorRichTextFallback() {
  const t = useTranslations("PdfEditor");
  return (
    <div className="pdf-editor__tiptap-editor pdf-editor__tiptap-editor--loading" aria-busy="true">
      {t("initializingEditor")}
    </div>
  );
}

const PdfEditorRichText = dynamic(
  () =>
    import("@/components/tools/PdfEditorRichText").then((mod) => mod.PdfEditorRichText),
  {
    ssr: false,
    loading: () => <PdfEditorRichTextFallback />,
  },
);

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function htmlToTipTapJson(html: string): Record<string, unknown> {
  const paragraphs = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  if (!paragraphs.length) return { ...EMPTY_JSON };
  return {
    type: "doc",
    content: paragraphs.map((block) => {
      const text = block
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
      return {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      };
    }),
  };
}

function ReferencePreview({
  fileBytes,
  pageIndex,
  password,
  loadingLabel,
}: {
  fileBytes: Uint8Array;
  pageIndex: number;
  password: string;
  loadingLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rendered = await renderPdfPageForUi(fileBytes, pageIndex, password, REDACT_UI_SCALE);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(rendered.canvas, 0, 0);
      } catch {
        // Password / corrupt page — leave blank until credentials change.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex, password]);

  return (
    <PdfEditStudio minHeight="min-h-[280px]">
      <PdfStudioPage className="relative inline-block max-w-full">
        {loading ? <p className="pdf-editor__hint">{loadingLabel}</p> : null}
        <canvas ref={canvasRef} className="pdf-editor__reference-canvas max-w-full" />
      </PdfStudioPage>
    </PdfEditStudio>
  );
}

export function PdfEditorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const t = useTranslations("PdfEditor");
  const ws = useWorkspaceI18n(tool.operation);

  const [state, setState] = useState<EditorState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [password, setPassword] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [pageDocs, setPageDocs] = useState<Record<number, PageDoc>>({});
  const [editorHtml, setEditorHtml] = useState("");
  const [editorJson, setEditorJson] = useState<Record<string, unknown>>(EMPTY_JSON);
  const [tiptapReady, setTiptapReady] = useState(false);
  const [ocrCompleteState, setOcrCompleteState] = useState(false);
  const [injectToken, setInjectToken] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [pageError, setPageError] = useState<{ pageIndex: number; message: string } | null>(null);
  const [backgroundPage, setBackgroundPage] = useState<number | null>(null);
  const [parsedReady, setParsedReady] = useState(false);
  const [drag, setDrag] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<null | (() => void)>(null);
  const pageDocsRef = useRef(pageDocs);
  const editorHtmlRef = useRef(editorHtml);
  const editorJsonRef = useRef(editorJson);
  const currentPageRef = useRef(currentPage);
  const stateRef = useRef<EditorState>(state);
  const tiptapReadyRef = useRef(false);
  const lastOcrResultRef = useRef<string | null>(null);
  const ocrRequestIdRef = useRef(0);
  const backgroundBusyRef = useRef(false);
  const parsedReadyRef = useRef(false);

  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));
  const baseId = useId();

  const goToState = useCallback((next: EditorState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const foregroundBusy = state === "parsing" || state === "ocr_running" || exporting;
  const currentDoc = pageDocs[currentPage];
  const canEdit = state === "editor_ready" && currentDoc?.status === "ready" && !foregroundBusy;
  const hasAnyReadyPage = Object.values(pageDocs).some((doc) => doc.status === "ready");

  useEffect(() => {
    pageDocsRef.current = pageDocs;
  }, [pageDocs]);
  useEffect(() => {
    editorHtmlRef.current = editorHtml;
  }, [editorHtml]);
  useEffect(() => {
    editorJsonRef.current = editorJson;
  }, [editorJson]);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  useEffect(() => {
    console.log(`DEBUG: Current Stage = ${state}`);
  }, [state]);
  useEffect(() => {
    tiptapReadyRef.current = tiptapReady;
  }, [tiptapReady]);
  useEffect(() => {
    parsedReadyRef.current = parsedReady;
  }, [parsedReady]);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  const flushCurrentPage = useCallback(() => {
    const page = currentPageRef.current;
    const existing = pageDocsRef.current[page];
    if (!existing || existing.status !== "ready") return;
    const next: PageDoc = {
      html: editorHtmlRef.current,
      json: editorJsonRef.current,
      status: "ready",
    };
    setPageDocs((prev) => ({ ...prev, [page]: next }));
    pageDocsRef.current = { ...pageDocsRef.current, [page]: next };
  }, []);

  const queueActivePageInject = useCallback((html: string, json: Record<string, unknown>) => {
    lastOcrResultRef.current = html;
    setEditorHtml(html);
    setEditorJson(json);
    setOcrCompleteState(true);
    setInjectToken((value) => value + 1);
    goToState("ocr_complete");
  }, [goToState]);

  const runOcrForPage = useCallback(
    async (
      bytes: Uint8Array,
      pageIndex: number,
      pwd: string,
      mode: "foreground" | "background",
    ) => {
      // Gate: never OCR until parsing confirmed.
      if (!parsedReadyRef.current) return;
      if (stateRef.current === "idle") return;

      cancelRef.current?.();
      const requestId = ++ocrRequestIdRef.current;

      if (mode === "foreground") {
        goToState("ocr_running");
        setOcrCompleteState(false);
        lastOcrResultRef.current = null;
        setPageError(null);
        setProgress(0);
        setDone(false);
        setRunError(null);
        setStatus(t("statusPageProgress", { current: pageIndex + 1, total: Math.max(pageCount, 1) }));
      } else {
        backgroundBusyRef.current = true;
        setBackgroundPage(pageIndex);
        setStatus(t("statusPageProgress", { current: pageIndex + 1, total: Math.max(pageCount, 1) }));
      }

      setPageDocs((prev) => ({
        ...prev,
        [pageIndex]: { html: "", json: EMPTY_JSON, status: "empty" },
      }));
      pageDocsRef.current = {
        ...pageDocsRef.current,
        [pageIndex]: { html: "", json: EMPTY_JSON, status: "empty" },
      };

      try {
        const blob = await renderPdfPageForOcr(bytes, pageIndex, pwd);
        if (requestId !== ocrRequestIdRef.current) return;

        await new Promise<void>((resolve, reject) => {
          const session = runSinglePageOcrInWorker(pageIndex, blob, PDF_EDITOR_OCR_LANGUAGES, {
            onProgress: (ocrProgress) => {
              if (requestId !== ocrRequestIdRef.current) return;
              setProgress(ocrProgress.percent);
              if (ocrProgress.status === "loading-lang") {
                setStatus(t("statusLoadingLanguages"));
              } else if (ocrProgress.status === "retry") {
                setStatus(t("statusRetryingPage", { page: pageIndex + 1 }));
              } else {
                setStatus(
                  t("statusPageProgress", {
                    current: pageIndex + 1,
                    total: Math.max(pageCount, 1),
                  }),
                );
              }
            },
            onComplete: (result) => {
              if (requestId !== ocrRequestIdRef.current) {
                resolve();
                return;
              }
              const html = ocrTextToHtml(result.text);
              const json = htmlToTipTapJson(html);
              const doc: PageDoc = { html, json, status: "ready" };
              setPageDocs((prev) => ({ ...prev, [pageIndex]: doc }));
              pageDocsRef.current = { ...pageDocsRef.current, [pageIndex]: doc };
              setProgress(100);
              cancelRef.current = null;

              if (mode === "foreground" || currentPageRef.current === pageIndex) {
                queueActivePageInject(html, json);
                setStatus(t("statusOcrDone", { count: 1 }));
              }

              if (mode === "background") {
                backgroundBusyRef.current = false;
                setBackgroundPage(null);
              }
              resolve();
            },
            onError: (failedPage, message) => {
              cancelRef.current = null;
              reject(Object.assign(new Error(message), { pageIndex: failedPage }));
            },
          });
          cancelRef.current = session.cancel;
        });
      } catch (error) {
        if (requestId !== ocrRequestIdRef.current) return;

        const failedPage =
          typeof error === "object" &&
          error &&
          "pageIndex" in error &&
          typeof (error as { pageIndex?: unknown }).pageIndex === "number"
            ? (error as { pageIndex: number }).pageIndex
            : pageIndex;

        const message = error instanceof Error ? error.message : "OCR failed";
        setPageDocs((prev) => ({
          ...prev,
          [failedPage]: { html: "", json: EMPTY_JSON, status: "error" },
        }));
        pageDocsRef.current = {
          ...pageDocsRef.current,
          [failedPage]: { html: "", json: EMPTY_JSON, status: "error" },
        };

        if (mode === "background") {
          backgroundBusyRef.current = false;
          setBackgroundPage(null);
          // Don't yank the user out of editor_ready for a background page failure
          // unless they're viewing that page.
          if (currentPageRef.current === failedPage) {
            setPageError({ pageIndex: failedPage, message });
            goToState("error");
            setOcrCompleteState(false);
            lastOcrResultRef.current = null;
          }
        } else {
          setCurrentPage(failedPage);
          currentPageRef.current = failedPage;
          setPageError({ pageIndex: failedPage, message });
          goToState("error");
          setOcrCompleteState(false);
          lastOcrResultRef.current = null;
          setProgress(0);
        }

        setStatus(t("statusOcrFailed", { page: failedPage + 1 }));
        capture(EVENTS.tool_run_error, {
          operation: tool.operation,
          slug,
          message,
          kind: "unknown",
        });
      }
    },
    [goToState, pageCount, queueActivePageInject, slug, t, tool.operation],
  );

  // Chunked OCR: after page 1 is shown (editor_ready), OCR remaining pages one-by-one.
  useEffect(() => {
    if (state !== "editor_ready") return;
    if (!fileBytes || !parsedReady) return;
    if (backgroundBusyRef.current) return;
    if (encrypted && !password.trim()) return;

    let nextPage: number | null = null;
    for (let i = 0; i < pageCount; i += 1) {
      const doc = pageDocs[i];
      if (!doc || doc.status === "empty") {
        nextPage = i;
        break;
      }
    }
    if (nextPage == null) return;
    // Skip the currently visible page if it's already ready (initial path OCR'd it).
    if (pageDocs[nextPage]?.status === "ready") return;

    const pageToRun = nextPage;
    const timer = window.setTimeout(() => {
      void runOcrForPage(fileBytes, pageToRun, password, "background");
    }, 50);
    return () => window.clearTimeout(timer);
  }, [state, fileBytes, parsedReady, pageCount, pageDocs, encrypted, password, runOcrForPage]);

  const showCachedOrOcr = useCallback(
    async (pageIndex: number) => {
      if (!fileBytes || !parsedReadyRef.current) return;
      const existing = pageDocsRef.current[pageIndex];
      if (existing?.status === "ready") {
        queueActivePageInject(existing.html, existing.json);
        setPageError(null);
        setStatus("");
        return;
      }
      if (encrypted && !password.trim()) {
        setStatus(t("statusEnterPassword"));
        return;
      }
      await runOcrForPage(fileBytes, pageIndex, password, "foreground");
    },
    [encrypted, fileBytes, password, queueActivePageInject, runOcrForPage, t],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      if (!fileBytes || foregroundBusy) return;
      const clamped = Math.max(0, Math.min(nextPage, Math.max(pageCount - 1, 0)));
      if (clamped === currentPageRef.current) return;
      flushCurrentPage();
      setOcrCompleteState(false);
      lastOcrResultRef.current = null;
      setCurrentPage(clamped);
      currentPageRef.current = clamped;
      void showCachedOrOcr(clamped);
    },
    [fileBytes, flushCurrentPage, foregroundBusy, pageCount, showCachedOrOcr],
  );

  const hardReset = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    ocrRequestIdRef.current += 1;
    backgroundBusyRef.current = false;
    lastOcrResultRef.current = null;
    tiptapReadyRef.current = false;
    parsedReadyRef.current = false;
    setTiptapReady(false);
    setParsedReady(false);
    setFile(null);
    setFileBytes(null);
    setPageCount(0);
    setCurrentPage(0);
    currentPageRef.current = 0;
    setPassword("");
    setEncrypted(false);
    setPageDocs({});
    pageDocsRef.current = {};
    setEditorHtml("");
    setEditorJson(EMPTY_JSON);
    setOcrCompleteState(false);
    setInjectToken((value) => value + 1);
    setExporting(false);
    setBackgroundPage(null);
    setProgress(0);
    setStatus("");
    setDone(false);
    setRunError(null);
    setPageError(null);
    goToState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [goToState]);

  const addFile = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming || []).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
      if (!list.length) {
        setStatus(ws.status("chooseValidPdf"));
        return;
      }

      const picked = list[0]!;
      goToState("parsing");
      parsedReadyRef.current = false;
      setParsedReady(false);
      setProgress(0);
      setStatus(t("statusPreparing"));
      setDone(false);
      setRunError(null);
      setPageError(null);
      setExporting(false);
      setBackgroundPage(null);
      backgroundBusyRef.current = false;
      lastOcrResultRef.current = null;
      setOcrCompleteState(false);
      setTiptapReady(false);
      tiptapReadyRef.current = false;

      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile(picked);
      setFileBytes(bytes);
      setCurrentPage(0);
      currentPageRef.current = 0;
      setPassword("");
      setPageDocs({});
      pageDocsRef.current = {};
      setEditorHtml("");
      setEditorJson(EMPTY_JSON);

      let isEncrypted = false;
      try {
        isEncrypted = await pdf.isPdfEncrypted(picked);
        setEncrypted(isEncrypted);
      } catch {
        setEncrypted(false);
      }

      let count = 0;
      try {
        count = await loadPdfPageCount(bytes, "");
        setPageCount(count);
      } catch {
        setPageCount(0);
        goToState("error");
        setPageError({ pageIndex: 0, message: "Failed to parse PDF" });
        setStatus(t("statusParseFailed"));
        return;
      }

      // Parsing confirmed — only now allow OCR.
      parsedReadyRef.current = true;
      setParsedReady(true);
      capture(EVENTS.file_selected, { count: 1, operation: tool.operation });

      if (isEncrypted) {
        setStatus(t("statusEnterPassword"));
        // Parsed and TipTap can mount empty; OCR waits for password + Retry.
        goToState("editor_ready");
        return;
      }

      await runOcrForPage(bytes, 0, "", "foreground");
    },
    [goToState, runOcrForPage, t, tool.operation, ws],
  );

  const onRetryPage = async (pageIndex?: number) => {
    if (!fileBytes || !parsedReadyRef.current || foregroundBusy) return;
    const target = pageIndex ?? pageError?.pageIndex ?? currentPage;
    if (encrypted && !password.trim()) {
      setStatus(t("statusEnterPassword"));
      return;
    }
    setPageError(null);
    await runOcrForPage(fileBytes, target, password, "foreground");
  };

  const onSave = () => {
    if (!file || !fileBytes || foregroundBusy || !hasAnyReadyPage) return;
    if (state !== "editor_ready" && state !== "ocr_complete") return;
    flushCurrentPage();

    setExporting(true);
    setProgress(0);
    setDone(false);
    setRunError(null);
    setStatus(t("statusGenerating"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    void (async () => {
      try {
        const sizes = await loadOriginalPageSizes(fileBytes, password);
        const docs = { ...pageDocsRef.current };
        const pages = sizes.map((size, pageIndex) => {
          const doc = docs[pageIndex];
          return {
            pageIndex,
            width: size.width,
            height: size.height,
            html: doc?.html || "<p></p>",
          };
        });

        const blob = await exportPdfEditorViaHtmlSnapshot(pages, (percent, exportStatus) => {
          setProgress(percent);
          if (exportStatus === "saving") setStatus(t("statusSaving"));
          else setStatus(t("statusGenerating"));
        });

        const outName = pdfEditorOutputName(file.name);
        downloadBlob(blob, outName);
        setDone(true);
        setExporting(false);
        setProgress(100);
        setStatus(t("statusDownloaded", { name: outName }));
        cancelRef.current = null;
        capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
        capture(EVENTS.download_click, { operation: tool.operation, slug });
        window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
      } catch (error) {
        const parsed = classifyPdfError(error);
        setRunError(parsed);
        setExporting(false);
        setProgress(0);
        setStatus("");
        cancelRef.current = null;
        capture(EVENTS.tool_run_error, {
          operation: tool.operation,
          slug,
          message: parsed.message,
          kind: parsed.kind,
        });
      }
    })();
  };

  const showProgress =
    state === "parsing" ||
    state === "ocr_running" ||
    exporting ||
    backgroundPage !== null;

  return (
    <div id="tool-workspace" className="pdf-editor space-y-4 pb-12 md:pb-8">
      <p className="pdf-editor__privacy pdf-editor__privacy--badge" role="status">
        {t("privacyBadge")}
      </p>

      <WorkspaceUploadShell>
        {!file ? (
          <FileUploadZone
            operation={tool.operation}
            drag={drag}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            title={ws.uploadTitle()}
            description={ws.uploadDescription()}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setDrag(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDrag(false);
              void addFile(event.dataTransfer.files);
            }}
            input={
              <input
                id={`${baseId}-input`}
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files?.length) void addFile(event.target.files);
                  event.target.value = "";
                }}
              />
            }
          />
        ) : (
          <div className="pdf-editor__advanced" id={WORKSPACE_OPERATIONS_ID}>
            <div className="pdf-editor__toolbar">
              {encrypted ? (
                <label className="pdf-editor__field" htmlFor={`${baseId}-password`}>
                  <span>{t("passwordLabel")}</span>
                  <input
                    id={`${baseId}-password`}
                    type="password"
                    value={password}
                    disabled={foregroundBusy}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="off"
                  />
                </label>
              ) : null}
              <div className="pdf-editor__toolbar-actions">
                <button
                  type="button"
                  className={toolOutlineBtn}
                  disabled={foregroundBusy || !parsedReady}
                  onClick={() => void onRetryPage(currentPage)}
                >
                  {t("rerunOcr")}
                </button>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  disabled={foregroundBusy || !hasAnyReadyPage}
                  onClick={onSave}
                >
                  {exporting ? t("generatingPdf") : t("saveDownload")}
                </button>
                <WorkspaceNewUploadButton
                  label={ws.uploadNewFile}
                  disabled={foregroundBusy}
                  onClick={() => startNewUpload(hardReset)}
                />
                <button type="button" className={toolOutlineBtn} onClick={hardReset}>
                  {t("hardReset")}
                </button>
              </div>
            </div>

            <div className="pdf-editor__page-indicator" aria-live="polite">
              {t("pageOf", { current: currentPage + 1, total: Math.max(pageCount, 1) })}
            </div>

            {showProgress ? (
              <WorkspaceProgressBar
                percent={progress}
                label={
                  status ||
                  t("statusPageProgress", {
                    current: (backgroundPage ?? currentPage) + 1,
                    total: Math.max(pageCount, 1),
                  })
                }
              />
            ) : null}

            <div className="pdf-editor__split">
              <section className="pdf-editor__pane" aria-label={t("referenceViewLabel")}>
                <header className="pdf-editor__pane-header">
                  <h2 className="pdf-editor__pane-title">{t("referenceViewTitle")}</h2>
                  <div className="pdf-editor__pager">
                    <button
                      type="button"
                      className={toolOutlineBtn}
                      disabled={foregroundBusy || currentPage <= 0}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      {t("prevPage")}
                    </button>
                    <span>
                      {t("pageOf", { current: currentPage + 1, total: Math.max(pageCount, 1) })}
                    </span>
                    <button
                      type="button"
                      className={toolOutlineBtn}
                      disabled={foregroundBusy || currentPage >= pageCount - 1}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      {t("nextPage")}
                    </button>
                  </div>
                </header>
                <div className="pdf-editor__pane-body">
                  {fileBytes ? (
                    <ReferencePreview
                      fileBytes={fileBytes}
                      pageIndex={currentPage}
                      password={password}
                      loadingLabel={t("loadingPreview")}
                    />
                  ) : null}
                </div>
              </section>

              <section className="pdf-editor__pane" aria-label={t("editViewLabel")}>
                <header className="pdf-editor__pane-header">
                  <h2 className="pdf-editor__pane-title">{t("editViewTitle")}</h2>
                  <span className="pdf-editor__pane-meta">
                    {t("pageOf", { current: currentPage + 1, total: Math.max(pageCount, 1) })}
                  </span>
                </header>
                <div className="pdf-editor__pane-body">
                  {/* TipTap mounts only after parse — editor_ready gate for inject lives inside. */}
                  {parsedReady ? (
                    <PdfEditorRichText
                      lastOcrResultRef={lastOcrResultRef}
                      ocrCompleteState={ocrCompleteState && tiptapReady}
                      injectToken={injectToken}
                      editable={canEdit}
                      dir="auto"
                      placeholder={t("editorPlaceholder")}
                      initializingLabel={t("initializingEditor")}
                      toolbarLabel={t("formatToolbar")}
                      labels={{
                        bold: t("bold"),
                        italic: t("italic"),
                        underline: t("underline"),
                        heading: t("heading"),
                        bulletList: t("bulletList"),
                        orderedList: t("orderedList"),
                      }}
                      onEditorReadyChange={(ready) => {
                        setTiptapReady(ready);
                        tiptapReadyRef.current = ready;
                        // Injection is gated on tiptapReady via ocrCompleteState prop above.
                        // When TipTap becomes ready and OCR already finished, re-assert complete.
                        if (ready && lastOcrResultRef.current && stateRef.current === "ocr_complete") {
                          setOcrCompleteState(true);
                          setInjectToken((value) => value + 1);
                        }
                      }}
                      onContentInjected={({ html, json }) => {
                        setEditorHtml(html);
                        setEditorJson(json);
                        goToState("editor_ready");
                      }}
                      onUpdate={({ html, json }) => {
                        setEditorHtml(html);
                        setEditorJson(json);
                        setDone(false);
                        if (pageDocsRef.current[currentPageRef.current]?.status === "ready") {
                          const doc: PageDoc = { html, json, status: "ready" };
                          setPageDocs((prev) => ({ ...prev, [currentPageRef.current]: doc }));
                          pageDocsRef.current = {
                            ...pageDocsRef.current,
                            [currentPageRef.current]: doc,
                          };
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="pdf-editor__tiptap-editor pdf-editor__tiptap-editor--loading"
                      aria-busy="true"
                    >
                      {t("initializingEditor")}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {state === "error" && pageError ? (
              <div className="pdf-editor__page-error" role="alert">
                <p className="pdf-editor__status">
                  {t("statusOcrFailed", { page: pageError.pageIndex + 1 })}
                  {pageError.message ? ` (${pageError.message})` : ""}
                </p>
                <button
                  type="button"
                  className={toolPrimaryBtn}
                  onClick={() => void onRetryPage(pageError.pageIndex)}
                >
                  {t("retryPage", { page: pageError.pageIndex + 1 })}
                </button>
              </div>
            ) : null}

            {!showProgress && status && state !== "error" ? (
              <p className="pdf-editor__status">{status}</p>
            ) : null}
            {runError ? (
              <ToolErrorRecovery
                operation={tool.operation}
                slug={slug}
                kind={runError.kind}
                technicalMessage={runError.message}
                onDismiss={() => setRunError(null)}
              />
            ) : null}
            {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}
          </div>
        )}
      </WorkspaceUploadShell>

      <p className="pdf-editor__stage-indicator" aria-live="polite">
        {t("stateStatus", { state })}
      </p>

      {state !== "idle" ? (
        <button type="button" className={`${toolOutlineBtn} mt-2`} onClick={hardReset}>
          {t("hardReset")}
        </button>
      ) : null}
    </div>
  );
}
