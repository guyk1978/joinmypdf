"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  auditPdfFile,
  auditorRedactOutputName,
  findingsToRedactionRects,
  kindLabel,
  type AuditFinding,
  type AuditProgress,
  type AuditReport,
} from "@/lib/pdf-safe-auditor";
import { redactPdfBytes, renderPdfPageForUi, REDACT_UI_SCALE } from "@/lib/pdf-redact";
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

function boxClass(severity: AuditFinding["severity"]) {
  if (severity === "high") return "bg-red-500/45 ring-2 ring-red-400/80";
  if (severity === "medium") return "bg-amber-400/40 ring-2 ring-amber-400/70";
  return "bg-sky-500/35 ring-2 ring-sky-400/60";
}

function AuditPageMap({
  fileBytes,
  pageIndex,
  findings,
  selectedId,
  loadingLabel,
  mapAlt,
  mapLegend,
}: {
  fileBytes: Uint8Array;
  pageIndex: number;
  findings: AuditFinding[];
  selectedId: string | null;
  loadingLabel: string;
  mapAlt: string;
  mapLegend: string;
}) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const pageFindings = findings.filter((f) => f.pageIndex === pageIndex);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void renderPdfPageForUi(fileBytes, pageIndex, undefined, REDACT_UI_SCALE).then(({ canvas }) => {
      if (cancelled) return;
      setCanvasEl(canvas);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fileBytes, pageIndex]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/15 bg-slate-950/50">
      {loading ? (
        <div className="flex aspect-[3/4] items-center justify-center text-sm text-ink-muted">{loadingLabel}</div>
      ) : null}
      {canvasEl ? (
        <div className="relative mx-auto w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={canvasEl.toDataURL("image/png")}
            alt={mapAlt}
            className="block h-auto w-full"
          />
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {pageFindings.map((f) => (
              <span
                key={f.id}
                className={`absolute rounded-sm ${boxClass(f.severity)} ${
                  selectedId === f.id ? "z-10 brightness-125" : ""
                }`}
                style={{
                  left: `${f.nx * 100}%`,
                  top: `${f.ny * 100}%`,
                  width: `${f.nw * 100}%`,
                  height: `${f.nh * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      <p className="border-t border-white/10 px-3 py-2 text-xs text-ink-muted">{mapLegend}</p>
    </div>
  );
}

export function SafeShareAuditorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [redacting, setRedacting] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setFileBytes(null);
    setReport(null);
    setPageIndex(0);
    setSelectedId(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsCommon("choosePdf"));
      return;
    }
    setDone(false);
    setRunError(null);
    setReport(null);
    const bytes = new Uint8Array(await next.arrayBuffer());
    setFile(next);
    setFileBytes(bytes);
    setStatus(ws.wsStatus("fileLoaded"));
    capture(EVENTS.file_selected, { operation: tool.operation });
  };

  const runAudit = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setStatus(ws.wsStatus("scanning"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const result = await auditPdfFile(file, setProgress);
      setReport(result);
      setPageIndex(result.findings[0]?.pageIndex ?? 0);
      setSelectedId(result.findings[0]?.id ?? null);
      setStatus(
        result.findings.length
          ? ws.wsStatus("found", { count: result.findings.length })
          : ws.wsStatus("none"),
      );
      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        count: result.findings.length,
      });
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
      setProgress(null);
    }
  };

  const redactAll = async () => {
    if (!file || !fileBytes || !report?.findings.length || redacting) return;
    setRedacting(true);
    setRunError(null);
    setStatus(ws.wsStatus("redacting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug, action: "redact_all" });

    try {
      const rects = findingsToRedactionRects(report.findings);
      const out = await redactPdfBytes(fileBytes, rects);
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), auditorRedactOutputName(file));
      setDone(true);
      setStatus(ws.wsStatus("redacted", { count: rects.length }));
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug, action: "redact_all" });
      capture(EVENTS.download_click, { operation: tool.operation, slug, format: "pdf" });
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
      setRedacting(false);
    }
  };

  useEffect(() => {
    if (report && pageIndex >= report.pageCount) {
      setPageIndex(0);
    }
  }, [report, pageIndex]);

  const canAudit = Boolean(file && !busy && !redacting);
  const canRedactAll = Boolean(report?.findings.length && fileBytes && !busy && !redacting);

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
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
          const f = e.dataTransfer.files?.[0];
          if (f) void pickFile(f);
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
              const f = e.target.files?.[0];
              if (f) void pickFile(f);
              e.target.value = "";
            }}
          />
        }
      />

      <div className="flex flex-wrap gap-3">
        <button type="button" className={toolPrimaryBtn} disabled={!canAudit} onClick={() => void runAudit()}>
          {busy ? ws.wsText("auditingLabel") : ws.wsText("auditLabel")}
        </button>
        {report?.findings.length ? (
          <button
            type="button"
            className={toolPrimaryBtn}
            disabled={!canRedactAll}
            onClick={() => void redactAll()}
          >
            {redacting ? ws.wsText("redactingLabel") : ws.wsText("redactAllLabel")}
          </button>
        ) : null}
        {file ? (
          <button type="button" className={toolSecondaryBtn} onClick={reset}>{ws.chooseAnotherFile}</button>
        ) : null}
      </div>

      {progress ? (
        <p className="text-sm text-ink-muted" role="status">
          {progress.phase === "loading"
            ? ws.wsCommon("loadingPdf")
            : ws.wsCommon("readingPdf")}
        </p>
      ) : null}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => setRunError(null)}
        />
      ) : (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {report && fileBytes ? (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label={ws.wsUi("totalFindings")} value={String(report.findings.length)} />
            <SummaryCard label={ws.wsUi("highRisk")} value={String(report.bySeverity.high)} tone="high" />
            <SummaryCard label={ws.wsUi("annotations")} value={String(report.byKind.annotation + report.byKind["hidden-comment"])} />
            <SummaryCard label={ws.wsUi("signaturesInk")} value={String(report.byKind.signature)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolSecondaryBtn}
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((p) => p - 1)}
            >
              {ws.wsUi("previousPage")}
            </button>
            <button
              type="button"
              className={toolSecondaryBtn}
              disabled={pageIndex >= report.pageCount - 1}
              onClick={() => setPageIndex((p) => p + 1)}
            >
              {ws.wsUi("nextPage")}
            </button>
            <select
              className="rounded-lg border border-white/15 bg-surface/60 px-3 py-2 text-sm text-ink"
              value={pageIndex}
              onChange={(e) => setPageIndex(Number(e.target.value))}
              aria-label={ws.wsUi("jumpToPage")}
            >
              {Array.from({ length: report.pageCount }, (_, i) => (
                <option key={i} value={i}>
                  {ws.wsCommon("pageNumber", { page: i + 1 })}
                  {report.findings.some((f) => f.pageIndex === i) ? ws.wsUi("pageFlagged") : ""}
                </option>
              ))}
            </select>
          </div>

          <section aria-labelledby={`${baseId}-map`}>
            <h2 id={`${baseId}-map`} className="mb-3 text-sm font-semibold text-ink">
              {ws.wsUi("visualMapHeading")}
            </h2>
            <AuditPageMap
              fileBytes={fileBytes}
              pageIndex={pageIndex}
              findings={report.findings}
              selectedId={selectedId}
              loadingLabel={ws.wsUi("loadingMap")}
              mapAlt={ws.wsUi("mapAlt", { page: pageIndex + 1 })}
              mapLegend={ws.wsUi("mapLegend", { count: report.findings.filter((f) => f.pageIndex === pageIndex).length })}
            />
          </section>

          {report.findings.length ? (
            <section aria-labelledby={`${baseId}-list`}>
              <h2 id={`${baseId}-list`} className="mb-3 text-sm font-semibold text-ink">
                {ws.wsUi("findingsHeading", { page: pageIndex + 1 })}
              </h2>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {report.findings
                  .filter((f) => f.pageIndex === pageIndex)
                  .map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={`w-full rounded-lg border px-3 py-2 text-start text-sm transition ${
                          selectedId === f.id
                            ? "border-brand bg-brand/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        }`}
                        onClick={() => {
                          setSelectedId(f.id);
                          setPageIndex(f.pageIndex);
                        }}
                      >
                        <span
                          className={`font-medium ${
                            f.severity === "high"
                              ? "text-red-400"
                              : f.severity === "medium"
                                ? "text-amber-300"
                                : "text-sky-300"
                          }`}
                        >
                          {f.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {kindLabel(f.kind)}
                          {f.excerpt ? ` · “${f.excerpt}”` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
              {report.findings.filter((f) => f.pageIndex === pageIndex).length === 0 ? (
                <p className="text-sm text-ink-muted">{ws.wsUi("noFindingsOnPage")}</p>
              ) : null}
            </section>
          ) : null}

          <p className="text-xs text-ink-muted">{ws.wsUi("disclaimer")}</p>
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("stickyAuditLabel")}
        secondaryHref="/tools/redact-pdf/"
        secondaryLabel={ws.wsText("stickyRedactLabel")}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "high";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        tone === "high" ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
