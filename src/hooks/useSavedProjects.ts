"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PROJECTS_CHANGE_EVENT,
  deleteSavedProject,
  listSavedProjects,
  type SavedProjectRecord,
} from "@/lib/project-storage";

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
    window.addEventListener(PROJECTS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(PROJECTS_CHANGE_EVENT, onChange);
  }, [refresh]);

  const removeProject = useCallback(async (projectId: string) => {
    await deleteSavedProject(projectId);
    await refresh();
  }, [refresh]);

  return { projects, hydrated, refresh, removeProject };
}
