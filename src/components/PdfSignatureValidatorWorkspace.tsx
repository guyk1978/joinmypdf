"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { WorkspaceNewUploadButton } from "@/components/WorkspaceNewUploadButton";
import { FileUploadZone } from "@/components/FileUploadZone";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { useWorkspaceFileFlow } from "@/hooks/useWorkspaceFileFlow";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { WorkspaceProgressBar } from "@/components/WorkspaceProgressBar";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import {
  validatePdfSignaturesFromFile,
  type PdfSignatureEntry,
  type PdfSignatureValidationReport,
  type SignatureValidationProgress,
} from "@/lib/pdf-signature-validator";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
import { toolPrimaryBtn, toolSecondaryBtn } from "@/lib/tool-ui";
import { progressLabelFromPhase } from "@/lib/workspace-progress-label";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

function progressPercent(progress: SignatureValidationProgress | null, busy: boolean): number {
  if (!progress) return busy ? 8 : 0;
  if (progress.phase === "reading") return 15;
  if (progress.phase === "scanning") return 35;
  if (progress.totalSignatures <= 0) return 55;
  const ratio = progress.currentSignature / progress.totalSignatures;
  return Math.min(100, Math.round(40 + ratio * 60));
}

function statusBadgeClass(status: PdfSignatureValidationReport["overall"] | PdfSignatureEntry["status"]) {
  if (status === "valid") return "bg-neutral-200 text-ink dark:bg-neutral-800";
  if (status === "invalid") return "bg-neutral-300 text-ink dark:bg-neutral-700";
  return "bg-neutral-100 text-ink-muted dark:bg-neutral-900";
}

export function PdfSignatureValidatorWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const labelProgress = (p: SignatureValidationProgress | null) => {
    if (!p) return "";
    if (p.phase === "validating" && p.totalSignatures > 0) {
      return ws.wsProgress("validating", { current: p.currentSignature, total: p.totalSignatures });
    }
    return progressLabelFromPhase(tool.operation, p, ws);
  };

  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PdfSignatureValidationReport | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<SignatureValidationProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const { startNewUpload } = useWorkspaceFileFlow(inputRef, Boolean(file));

  const acceptPdf = useCallback((f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), []);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setReport(null);
    setStatus("");
    setProgress(null);
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (next: File) => {
    if (!acceptPdf(next)) {
      setStatus(ws.wsStatus("invalidType"));
      return;
    }
    if (next.size === 0) {
      setStatus(ws.wsStatus("emptyFile"));
      return;
    }
    setDone(false);
    setRunError(null);
    setReport(null);
    setFile(next);
    setStatus(ws.wsStatus("fileReady", { name: next.name }));
    capture(EVENTS.file_selected, { operation: tool.operation });
  };

  const runValidation = async () => {
    if (!file || busy) return;
    setBusy(true);
    setRunError(null);
    setDone(false);
    setReport(null);
    setStatus(ws.wsStatus("starting"));
    capture(EVENTS.tool_run_start, { operation: tool.operation, slug });

    try {
      const result = await validatePdfSignaturesFromFile(file, setProgress);
      setReport(result);
      setDone(true);

      if (result.overall === "none") {
        setStatus(ws.wsStatus("none"));
      } else if (result.overall === "valid") {
        setStatus(ws.wsStatus("valid", { count: result.signatures.length }));
      } else {
        setStatus(ws.wsStatus("invalid", { count: result.signatures.length }));
      }

      capture(EVENTS.tool_run_success, {
        operation: tool.operation,
        slug,
        count: result.signatures.length,
        overall: result.overall,
      });
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
      setProgress(null);
    }
  };

  const overallLabel = (overall: PdfSignatureValidationReport["overall"]) => {
    if (overall === "valid") return ws.wsText("resultValid");
    if (overall === "invalid") return ws.wsText("resultInvalid");
    return ws.wsText("resultNone");
  };

  const entryStatusLabel = (entry: PdfSignatureEntry) =>
    entry.status === "valid" ? ws.wsText("signatureValid") : ws.wsText("signatureInvalid");

  const canValidate = Boolean(file && !busy);
  const percent = progressPercent(progress, busy);

  return (
    <div id="tool-workspace" className="space-y-3 pb-12 md:pb-8">
      <WorkspaceUploadShell>
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
      </WorkspaceUploadShell>

      {file ? (
        <div id={WORKSPACE_OPERATIONS_ID} className="tool-workspace-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{status}</p>
            </div>
            <WorkspaceNewUploadButton onClick={() => startNewUpload(reset)} label={ws.wsCommon("chooseAnotherOrClear")} />
          </div>

          <button type="button" className={toolPrimaryBtn} disabled={!canValidate} onClick={() => void runValidation()}>
            {busy ? ws.wsText("validatingLabel") : ws.wsText("validateLabel")}
          </button>

          {busy ? (
            <WorkspaceProgressBar percent={percent} label={labelProgress(progress)} />
          ) : null}

          {report ? (
            <div className="space-y-3">
              <div className={`inline-flex px-3 py-2 text-sm font-semibold ${statusBadgeClass(report.overall)}`}>
                {overallLabel(report.overall)}
              </div>

              {report.signatures.length > 0 ? (
                <ul className="space-y-2">
                  {report.signatures.map((entry) => (
                    <li
                      key={entry.index}
                      className="space-y-2 bg-neutral-100 p-4 dark:bg-neutral-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {ws.wsText("signatureHeading", { index: entry.index })}
                        </p>
                        <span className={`px-2 py-1 text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
                          {entryStatusLabel(entry)}
                        </span>
                      </div>
                      <dl className="grid gap-1 text-sm text-ink-muted sm:grid-cols-2">
                        {entry.signerName ? (
                          <div>
                            <dt className="font-medium text-ink">{ws.wsText("signerLabel")}</dt>
                            <dd>{entry.signerName}</dd>
                          </div>
                        ) : null}
                        {entry.signingDate ? (
                          <div>
                            <dt className="font-medium text-ink">{ws.wsText("signedOnLabel")}</dt>
                            <dd>{entry.signingDate}</dd>
                          </div>
                        ) : null}
                        {entry.reason ? (
                          <div>
                            <dt className="font-medium text-ink">{ws.wsText("reasonLabel")}</dt>
                            <dd>{entry.reason}</dd>
                          </div>
                        ) : null}
                        {entry.location ? (
                          <div>
                            <dt className="font-medium text-ink">{ws.wsText("locationLabel")}</dt>
                            <dd>{entry.location}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {entry.message ? <p className="text-xs text-ink-muted">{entry.message}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">{ws.wsText("noDigitalSignatureHint")}</p>
              )}

              <p className="text-xs text-ink-muted">{ws.wsText("privacyNote")}</p>
              <p className="text-xs text-ink-muted">{ws.wsText("trustDisclaimer")}</p>
            </div>
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

          {done && report ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className={toolSecondaryBtn} onClick={() => void runValidation()}>
                {ws.wsText("validateAgainLabel")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {done ? <PostSuccessUpsell operation={tool.operation} sourceFile={file} /> : null}

      <StickyMobileCta
        href="#tool-workspace"
        label={ws.wsText("validateLabel")}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}
