"use client";

import { useLayoutEffect, useRef } from "react";
import { usePendingFiles } from "@/context/PendingFilesContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";

/**
 * Consume homepage (or other) pending uploads once on mount and hand them
 * to the active tool workspace when they match `accept`.
 * Runs in useLayoutEffect (before shell input injection) and clears staged
 * storage only after a successful handoff.
 */
export function useConsumePendingFiles(
  accept: (file: File) => boolean,
  onFiles: (files: File[]) => void,
) {
  const { peekPendingFiles, clearPendingFiles } = usePendingFiles();
  const shell = useToolPageShell();
  const acceptRef = useRef(accept);
  const onFilesRef = useRef(onFiles);
  const doneRef = useRef(false);
  acceptRef.current = accept;
  onFilesRef.current = onFiles;

  useLayoutEffect(() => {
    if (doneRef.current) return;

    const pending = peekPendingFiles({ toolSlug: shell.slug || undefined });
    if (!pending?.length) {
      doneRef.current = true;
      return;
    }

    const accepted = pending.filter((file) => acceptRef.current(file));
    if (!accepted.length) {
      doneRef.current = true;
      return;
    }

    onFilesRef.current(accepted);
    clearPendingFiles();
    doneRef.current = true;
  }, [clearPendingFiles, peekPendingFiles, shell.slug]);
}
