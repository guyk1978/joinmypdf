"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { TimelineProject } from "@/lib/timeline/types";
import { createDefaultTimelineProject } from "@/lib/timeline/defaults";
import { TIMELINE_PRINT_ROOT_ID } from "@/lib/timeline/constants";
import { exportTimelineElementToPdf } from "@/lib/timeline/export-pdf";
import { TimelineFormPanel } from "@/components/timeline/TimelineFormPanel";
import { TimelineCanvasPanel } from "@/components/timeline/TimelineCanvasPanel";
import { matteWorkspaceBanner, matteWorkspaceSection } from "@/lib/tool-ui";

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
  const t = useTranslations("StudioTools");
  const [project, setProject] = useState<TimelineProject>(
    () => initialProject ?? createDefaultTimelineProject(),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(t("generatingPdf"));
    try {
      await handleTimelineDownload(project);
      setStatus(t("pdfDownloaded"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("pdfExportFailed");
      setStatus(message);
      console.error("[TimelineGenerator]", err);
    } finally {
      setBusy(false);
    }
  }, [busy, project]);

  return (
    <div className="timeline-generator-workspace space-y-2">
      {templateSlug ? (
        <p className={matteWorkspaceBanner}>
          {t("timelineTemplateLoaded", { slug: templateSlug.replace(/-/g, " ") })}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-black dark:text-neutral-200" aria-live="polite">
          {status}
        </p>
      ) : null}
      <div className="grid gap-2 lg:grid-cols-12 lg:items-start">
        <section className={`${matteWorkspaceSection} lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto`}>
          <TimelineFormPanel project={project} onChange={setProject} />
        </section>
        <section className={`min-h-[420px] ${matteWorkspaceSection} lg:col-span-8 lg:min-h-[calc(100vh-6rem)]`}>
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
