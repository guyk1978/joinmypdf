"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  clearPendingUploadStorage,
  readPendingUploadFiles,
  writePendingUploadFiles,
} from "@/lib/pending-upload-storage";

type PendingOptions = {
  /** When set, handoff only restores on the matching tool page. */
  toolSlug?: string;
};

type Ctx = {
  /**
   * Stage files for the next tool page. Writes sessionStorage (awaited) so
   * hard/soft navigations still recover the upload, plus an in-memory copy
   * for same-tree client transitions.
   */
  setPendingFiles: (files: File[] | null, options?: PendingOptions) => Promise<void>;
  /** Read without clearing — use before attempting dropzone injection. */
  peekPendingFiles: (options?: PendingOptions) => File[] | null;
  /** Read and clear memory + sessionStorage. */
  consumePendingFiles: (options?: PendingOptions) => File[] | null;
  /** Drop staged files without reading. */
  clearPendingFiles: () => void;
};

const PendingFilesContext = createContext<Ctx | null>(null);

export function PendingFilesProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<File[] | null>(null);
  const toolSlugRef = useRef<string | undefined>(undefined);

  const clearPendingFiles = useCallback(() => {
    pendingRef.current = null;
    toolSlugRef.current = undefined;
    clearPendingUploadStorage();
  }, []);

  const setPendingFiles = useCallback(
    async (files: File[] | null, options?: PendingOptions) => {
      if (!files?.length) {
        clearPendingFiles();
        return;
      }

      pendingRef.current = files;
      toolSlugRef.current = options?.toolSlug;

      try {
        await writePendingUploadFiles(files, options?.toolSlug);
      } catch {
        // Quota / oversized — keep in-memory handoff for SPA navigations.
        clearPendingUploadStorage();
      }
    },
    [clearPendingFiles],
  );

  const matchesSlug = useCallback((options?: PendingOptions, stagedSlug?: string) => {
    if (!options?.toolSlug) return true;
    if (!stagedSlug) return true;
    return stagedSlug === options.toolSlug;
  }, []);

  const peekPendingFiles = useCallback(
    (options?: PendingOptions) => {
      const memory = pendingRef.current;
      if (memory?.length && matchesSlug(options, toolSlugRef.current)) {
        return memory;
      }
      return readPendingUploadFiles(options?.toolSlug);
    },
    [matchesSlug],
  );

  const consumePendingFiles = useCallback(
    (options?: PendingOptions) => {
      const memory = pendingRef.current;
      if (memory?.length && matchesSlug(options, toolSlugRef.current)) {
        pendingRef.current = null;
        toolSlugRef.current = undefined;
        clearPendingUploadStorage();
        return memory;
      }

      const fromSession = readPendingUploadFiles(options?.toolSlug);
      if (fromSession?.length) {
        if (matchesSlug(options, toolSlugRef.current)) {
          pendingRef.current = null;
          toolSlugRef.current = undefined;
        }
        clearPendingUploadStorage();
        return fromSession;
      }

      return null;
    },
    [matchesSlug],
  );

  const value = useMemo(
    () => ({
      setPendingFiles,
      peekPendingFiles,
      consumePendingFiles,
      clearPendingFiles,
    }),
    [setPendingFiles, peekPendingFiles, consumePendingFiles, clearPendingFiles],
  );

  return (
    <PendingFilesContext.Provider value={value}>{children}</PendingFilesContext.Provider>
  );
}

export function usePendingFiles() {
  const ctx = useContext(PendingFilesContext);
  if (!ctx) throw new Error("usePendingFiles requires PendingFilesProvider");
  return ctx;
}
