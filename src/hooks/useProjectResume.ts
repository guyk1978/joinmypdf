"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSavedProject } from "@/lib/project-storage";

type RestorePayload = {
  files: File[];
  settings: Record<string, unknown>;
  projectName: string;
};

type UseProjectResumeOptions = {
  toolSlug: string;
  onRestore: (payload: RestorePayload) => void;
  onStatus?: (message: string) => void;
};

export function useProjectResume({ toolSlug, onRestore, onStatus }: UseProjectResumeOptions) {
  const searchParams = useSearchParams();
  const restoredRef = useRef<string | null>(null);

  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId || restoredRef.current === projectId) return;

    let cancelled = false;

    void (async () => {
      try {
        const saved = await getSavedProject(projectId);
        if (cancelled || !saved) return;
        if (saved.project.toolSlug !== toolSlug) return;

        restoredRef.current = projectId;
        onRestore({
          files: saved.files,
          settings: saved.project.settings,
          projectName: saved.project.name,
        });
        onStatus?.(saved.project.name);
      } catch {
        // ignore restore failures silently
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, toolSlug, onRestore, onStatus]);
}
