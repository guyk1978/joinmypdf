"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PROJECTS_CHANGE_EVENT,
  deleteSavedProject,
  listSavedProjects,
  type SavedProjectRecord,
} from "@/lib/project-storage";
import {
  PROJECTS_CHANGED_MESSAGE,
  PROJECT_SAVED_MESSAGE,
} from "@/lib/workspace-project-messages";

export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await listSavedProjects();
      setProjects(rows);
    } catch {
      setProjects([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === PROJECTS_CHANGED_MESSAGE || type === PROJECT_SAVED_MESSAGE) {
        void refresh();
      }
    };

    window.addEventListener(PROJECTS_CHANGE_EVENT, onChange);
    window.addEventListener(PROJECTS_CHANGED_MESSAGE, onChange);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener(PROJECTS_CHANGE_EVENT, onChange);
      window.removeEventListener(PROJECTS_CHANGED_MESSAGE, onChange);
      window.removeEventListener("message", onMessage);
    };
  }, [refresh]);

  const removeProject = useCallback(
    async (projectId: string) => {
      await deleteSavedProject(projectId);
      await refresh();
    },
    [refresh],
  );

  return { projects, hydrated, refresh, removeProject };
}
