"use client";

import { useCallback, useState } from "react";
import type { TimelineProject } from "@/lib/timeline/types";
import { createDefaultTimelineProject } from "@/lib/timeline/defaults";
import { TIMELINE_PRINT_ROOT_ID } from "@/lib/timeline/constants";
import { exportTimelineElementToPdf } from "@/lib/timeline/export-pdf";
import { TimelineFormPanel } from "@/components/timeline/TimelineFormPanel";
import { TimelineCanvasPanel } from "@/components/timeline/TimelineCanvasPanel";

type TimelineGeneratorProps = {
  initialProject?: TimelineProject;
  templateSlug?: string;
};

export async function handleTimelineDownload(project: TimelineProject): Promise<void> {
  const root = window.document.getElementById(TIMELINE_PRINT_ROOT_ID);
  if (!root) {
    throw new Error("Timeline chart is not ready. Try again in a moment.");
  }
  await exportTimelineElementToPdf(root, project);
}

export function TimelineGenerator({ initialProject, templateSlug }: TimelineGeneratorProps) {
  const [project, setProject] = useState<TimelineProject>(
    () => initialProject ?? createDefaultTimelineProject(),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Generating PDF…");
    try {
      await handleTimelineDownload(project);
      setStatus("PDF downloaded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF export failed.";
      setStatus(message);
      console.error("[TimelineGenerator]", err);
    } finally {
      setBusy(false);
    }
  }, [busy, project]);

  return (
    <div className="timeline-generator-workspace space-y-4">
      {templateSlug ? (
        <p className="rounded-xl border border-brand/25 bg-brand/10 px-4 py-2 text-sm text-ink-muted">
          Template loaded for{" "}
          <span className="font-medium text-ink">{templateSlug.replace(/-/g, " ")}</span> — edit any
          task or date before you download.
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-ink-muted" aria-live="polite">
          {status}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start xl:gap-10">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <TimelineFormPanel project={project} onChange={setProject} />
        </section>
        <section className="min-h-[480px] rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6 lg:min-h-[calc(100vh-7rem)]">
          <TimelineCanvasPanel
            project={project}
            onDownload={onDownload}
            downloadBusy={busy}
          />
        </section>
      </div>
    </div>
  );
}
