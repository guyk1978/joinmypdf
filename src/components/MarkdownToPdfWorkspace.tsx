"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { ToolErrorRecovery } from "@/components/ToolErrorRecovery";
import {
  convertMarkdownToPdf,
  DEFAULT_MARKDOWN_SAMPLE,
  MARKDOWN_THEMES,
  markdownToPdfOutputName,
  parseMarkdownToHtml,
  previewSurfaceClass,
  readMarkdownFile,
  type MarkdownProgressPhase,
  type MarkdownTheme,
} from "@/lib/markdown-to-pdf";
import { classifyPdfError, type PdfProcessingError } from "@/lib/pdf-errors";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";
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

function progressLabel(phase: MarkdownProgressPhase | null): string {
  if (!phase) return "";
  if (phase === "parsing") return "Parsing Markdown…";
  if (phase === "rendering") return "Applying layout theme…";
  return "Building PDF…";
}

function progressPercent(phase: MarkdownProgressPhase | null, busy: boolean): number {
  if (!phase) return busy ? 10 : 0;
  if (phase === "parsing") return 32;
  if (phase === "rendering") return 68;
  return 92;
}

export function MarkdownToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN_SAMPLE);
  const [previewHtml, setPreviewHtml] = useState("");
  const [theme, setTheme] = useState<MarkdownTheme>("github");
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"editor" | "upload">("editor");
  const [phase, setPhase] = useState<MarkdownProgressPhase | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [runError, setRunError] = useState<PdfProcessingError | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void parseMarkdownToHtml(markdown)
        .then((html) => {
          if (!cancelled) setPreviewHtml(html);
        })
        .catch(() => {
          if (!cancelled) setPreviewHtml("<p class='text-red-400'>Preview unavailable — check syntax.</p>");
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [markdown]);

  const previewStyles = useMemo(() => {
    if (theme === "minimal-dark") {
      return `[&_h1]:text-[#f0f6fc] [&_h2]:text-[#f0f6fc] [&_a]:text-[#58a6ff] [&_pre]:bg-[#161b22] [&_pre]:border [&_pre]:border-[#30363d] [&_code]:font-mono [&_table]:border-collapse [&_th]:border [&_th]:border-[#30363d] [&_td]:border [&_td]:border-[#30363d]`;
    }
    if (theme === "academic") {
      return `[&_h1]:font-serif [&_p]:font-serif [&_pre]:bg-slate-50 [&_table]:border-collapse [&_th]:border [&_td]:border`;
    }
    return `[&_pre]:bg-[#f6f8fa] [&_table]:border-collapse [&_th]:border [&_td]:border [&_a]:text-[#0969da]`;
  }, [theme]);

  const reset = useCallback(() => {
    setMarkdown(DEFAULT_MARKDOWN_SAMPLE);
    setFile(null);
    setPhase(null);
    setStatus("");
    setDone(false);
    setRunError(null);
    setInputMode("editor");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFile = async (picked: File) => {
    try {
      const text = await readMarkdownFile(picked);
      setFile(picked);
      setMarkdown(text);
      setInputMode("editor");
      setDone(false);
      setRunError(null);
      setStatus(`${picked.name} loaded — edit or convert when ready.`);
      capture(EVENTS.file_selected, { operation: tool.operation, count: 1 });
    } catch (e) {
      const parsed = classifyPdfError(e);
      setRunError(parsed);
      setStatus("");
    }
  };

  const onConvert = async () => {
    setBusy(true);
    setDone(false);
    setRunError(null);
    setPhase("parsing");
    setStatus("Compiling Markdown…");

    try {
      const blob = await convertMarkdownToPdf(markdown, theme, (p) => {
        setPhase(p);
        setStatus(progressLabel(p));
      });

      const titleLine = markdown.match(/^#\s+(.+)$/m)?.[1];
      downloadBlob(blob, markdownToPdfOutputName(file, titleLine));
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

  return (
    <div id="tool-workspace" className="space-y-6 pb-24 md:pb-8">
      <div className="privacy-callout" role="note">
        <strong>100% Secure:</strong> Markdown parsing and PDF rendering run entirely in your browser. Your notes
        never leave your device.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setInputMode("editor")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              inputMode === "editor" ? "bg-brand text-surface" : "text-ink-muted hover:text-ink"
            }`}
          >
            Write / paste
          </button>
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              inputMode === "upload" ? "bg-brand text-surface" : "text-ink-muted hover:text-ink"
            }`}
          >
            Upload .md
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="font-medium text-ink">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MarkdownTheme)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {MARKDOWN_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {inputMode === "upload" ? (
        <FileUploadZone
          drag={drag}
          role="button"
          tabIndex={0}
          aria-controls={`${baseId}-input`}
          className="cursor-pointer"
          title="Drop a Markdown file here"
          description="Upload a .md file, then switch to Write / paste to edit or preview."
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
              accept=".md,text/markdown,text/x-markdown"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void pickFile(picked);
                e.target.value = "";
              }}
            />
          }
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Markdown source</h2>
            {file ? <span className="text-xs text-ink-muted">{file.name}</span> : null}
          </div>
          <textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setDone(false);
            }}
            spellCheck={false}
            className="min-h-[320px] w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none lg:min-h-[420px]"
            placeholder="# Title&#10;&#10;Write Markdown here…"
            aria-label="Markdown source editor"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Live HTML preview</h2>
          <div
            className={`${previewSurfaceClass(theme)} min-h-[320px] overflow-auto text-sm leading-relaxed lg:min-h-[420px] ${previewStyles}`}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {busy && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{progressLabel(phase)}</span>
            <span>{progressPercent(phase, busy)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
              style={{ width: `${Math.max(8, progressPercent(phase, busy))}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || !markdown.trim()}
          onClick={() => void onConvert()}
          className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-brand/20 transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download PDF
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/5 disabled:opacity-50"
        >
          Reset sample
        </button>
      </div>

      {runError ? (
        <ToolErrorRecovery
          operation={tool.operation}
          slug={slug}
          kind={runError.kind}
          technicalMessage={runError.message}
          onDismiss={() => {
            setRunError(null);
            setStatus("Adjust your Markdown and try again.");
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
        label="Download PDF"
        secondaryHref="/"
        secondaryLabel="Home"
      />
    </div>
  );
}