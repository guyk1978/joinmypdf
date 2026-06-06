"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone"
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";;
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  autocadToPdfOutputName,
  convertAutocadToPdfBytes,
  DWG_INSTRUCTION_MESSAGE,
  isDwgFile,
  isDxfFile,
  type AutocadProgressPhase,
} from "@/lib/autocad-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
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

function progressLabel(phase: AutocadProgressPhase | null): string {
  if (!phase) return "";
  if (phase === "parsing") return "Parsing DXF vector entities…";
  if (phase === "layout") return "Rendering blueprint PDF…";
  return "Finalizing download…";
}

export function AutocadToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<AutocadProgressPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const acceptCad = useCallback(
    (f: File) => isDxfFile(f) || isDwgFile(f),
    [],
  );

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const reset = useCallback(() => {
    setFile(null);
    setPhase(null);
    setProgress(0);
    setStatus("");
    setDone(false);
    setRunError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = (picked: File) => {
    if (!acceptCad(picked)) {
      setStatus("Please choose a .dxf or .dwg AutoCAD drawing file.");
      return;
    }
    if (picked.size === 0) {
      setStatus("That file is empty. Choose another drawing.");
      return;
    }
    setFile(picked);
    setDone(false);
    setRunError(null);
    setPhase(null);
    setProgress(0);
    setStatus(
      isDwgFile(picked)
        ? "Binary .dwg detected — save as DXF in AutoCAD to convert here."
        : `${picked.name} ready — click Convert to PDF when you are set.`,
    );
    capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
  };

  const onConvert = async () => {
    if (!file || isDwgFile(file)) return;

    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("parsing");
    setProgress(10);
    setStatus("Reading drawing…");

    try {
      const bytes = await convertAutocadToPdfBytes(file, (p, pct) => {
        setPhase(p);
        setProgress(pct);
        setStatus(progressLabel(p));
      });

      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), autocadToPdfOutputName(file));
      setDone(true);
      setStatus("Conversion complete. Your download should start automatically.");
      capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
      capture(EVENTS.download_click, { operation: tool.operation, slug });
      window.setTimeout(() => dispatchToolComplete({ operation: tool.operation, slug }), 400);
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
      setPhase(null);
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

  const showDwgNotice = Boolean(file && isDwgFile(file));

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> AutoCAD conversion runs entirely in your browser. Your drawing never leaves your
        device.
      </div>

      {!file ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a DXF or DWG file here"
          description="DXF converts locally to a vector PDF. For .dwg files, save as DXF in AutoCAD first."
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
            if (picked) pickFile(picked);
          }}
          onClick={() => inputRef.current?.click()}
          input={
            <input
              id={`${baseId}-input`}
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".dxf,.dwg,application/dxf,application/acad,image/vnd.dxf,application/x-dxf"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-1 text-xs text-ink-muted">{progressLabel(phase)}</p>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Client-side only
            </span>
          </div>

          {showDwgNotice && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90">
              <p className="font-semibold text-ink">Save as DXF for full vector precision</p>
              <p className="mt-2 text-ink-muted">{DWG_INSTRUCTION_MESSAGE}</p>
              <p className="mt-3 text-xs text-ink-muted">
                In AutoCAD: File → Save As → AutoCAD DXF (.dxf), then upload the .dxf file here.
              </p>
            </div>
          )}

          {busy && (
            <div className="space-y-3" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{progressLabel(phase)}</span>
                <span>{Math.min(100, Math.max(5, progress))}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
                  style={{ width: `${Math.max(8, progress)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || showDwgNotice}
              onClick={() => void onConvert()}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showDwgNotice ? "Use DXF file" : "Convert to PDF"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reset}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
            >
              Choose another file
            </button>
          </div>
        </div>
      )}

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus(file ? "Try again or choose another file." : "");
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
        label={file && !showDwgNotice ? "Convert to PDF" : "AutoCAD to PDF"}
        secondaryHref="/"
        secondaryLabel={ws.home}
      />
    </div>
  );
}