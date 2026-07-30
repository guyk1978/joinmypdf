"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSavedProject } from "@/lib/project-storage";
import {
  clearPendingProjectResume,
  peekPendingProjectResume,
} from "@/lib/project-resume";

type RestorePayload = {
  files: File[];
  settings: Record<string, unknown>;
  projectName: string;
};

type UseProjectResumeOptions = {
  toolSlug: string;
  /** Optional alternate ids (e.g. operation name) accepted from saved records. */
  acceptSlugs?: string[];
  onRestore: (payload: RestorePayload) => void;
  onStatus?: (message: string) => void;
};

function readSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

/**
 * Resolve ?project= for Library → Resume.
 * Prefer this frame's search params / location; when embedded (`embed=1`),
 * also read the parent URL / session handoff if the embed omitted the id.
 */
function resolveResumeProjectId(
  searchParams: URLSearchParams,
  toolSlug: string,
): string | null {
  const fromParams = searchParams.get("project") || readSearchParam("project");
  if (fromParams) return fromParams;

  if (typeof window === "undefined") return null;

  const isEmbed =
    searchParams.get("embed") === "1" || readSearchParam("embed") === "1";

  if (isEmbed && window.parent !== window) {
    try {
      const fromParent = new URL(window.parent.location.href).searchParams.get(
        "project",
      );
      if (fromParent) return fromParent;
    } catch {
      // Cross-origin parent — fall through to session handoff.
    }
  }

  return peekPendingProjectResume(toolSlug);
}

function slugMatches(
  savedSlug: string,
  toolSlug: string,
  acceptSlugs?: string[],
): boolean {
  if (savedSlug === toolSlug) return true;
  if (acceptSlugs?.includes(savedSlug)) return true;
  return false;
}

export function useProjectResume({
  toolSlug,
  acceptSlugs,
  onRestore,
  onStatus,
}: UseProjectResumeOptions) {
  const searchParams = useSearchParams();
  const restoredRef = useRef<string | null>(null);
  const onRestoreRef = useRef(onRestore);
  const onStatusRef = useRef(onStatus);
  onRestoreRef.current = onRestore;
  onStatusRef.current = onStatus;

  const acceptKey = (acceptSlugs ?? []).join("|");

  useEffect(() => {
    const projectId = resolveResumeProjectId(searchParams, toolSlug);
    if (!projectId || restoredRef.current === projectId) return;

    let cancelled = false;
    let attempts = 0;
    const timers: number[] = [];

    const run = async () => {
      attempts += 1;
      try {
        const saved = await getSavedProject(projectId);
        if (cancelled) return;
        if (!saved) {
          // IndexedDB can lag right after a soft navigation — retry briefly.
          if (attempts < 8) {
            timers.push(
              window.setTimeout(() => {
                if (!cancelled) void run();
              }, 120 * attempts),
            );
          }
          return;
        }
        if (!slugMatches(saved.project.toolSlug, toolSlug, acceptSlugs)) {
          return;
        }
        if (saved.files.length === 0) {
          return;
        }

        restoredRef.current = projectId;
        clearPendingProjectResume();
        onRestoreRef.current({
          files: saved.files,
          settings: saved.project.settings,
          projectName: saved.project.name,
        });
        onStatusRef.current?.(saved.project.name);
      } catch {
        if (!cancelled && attempts < 5) {
          timers.push(
            window.setTimeout(() => {
              if (!cancelled) void run();
            }, 200 * attempts),
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [searchParams, toolSlug, acceptKey, acceptSlugs]);
}
