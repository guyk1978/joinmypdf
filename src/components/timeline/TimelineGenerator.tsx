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
        <p className="border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400">
          Template loaded for{" "}
          <span className="font-medium text-neutral-200">{templateSlug.replace(/-/g, " ")}</span> — edit any
          task or date before you download.
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-neutral-400" aria-live="polite">
          {status}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <section className="border border-neutral-800 bg-neutral-900 p-4 lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <TimelineFormPanel project={project} onChange={setProject} />
        </section>
        <section className="min-h-[420px] border border-neutral-800 bg-neutral-900 p-4 lg:col-span-8 lg:min-h-[calc(100vh-6rem)]">
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
