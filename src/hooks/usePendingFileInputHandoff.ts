"use client";

import { useLayoutEffect, useRef } from "react";
import { usePendingFiles } from "@/context/PendingFilesContext";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  assignFilesToInput,
  fileMatchesAcceptAttr,
} from "@/lib/upload-accept";

function handoffToInput(input: HTMLInputElement, pending: File[]): boolean {
  const accepted = pending.filter((file) => fileMatchesAcceptAttr(file, input.accept));
  if (!accepted.length) return false;
  return assignFilesToInput(input, accepted);
}

/**
 * Inject homepage pending uploads into a mounted file input (change event).
 * Retries until the input exists; clears storage only after a successful inject.
 */
export function usePendingFileInputHandoff(
  inputRef: React.RefObject<HTMLInputElement | null>,
) {
  const { peekPendingFiles, clearPendingFiles } = usePendingFiles();
  const shell = useToolPageShell();
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    if (doneRef.current) return;

    let cancelled = false;
    let attempts = 0;
    let timer = 0;
    const toolSlug = shell.slug || undefined;

    const tick = () => {
      if (cancelled || doneRef.current) return;

      const pending = peekPendingFiles({ toolSlug });
      if (!pending?.length) {
        doneRef.current = true;
        return;
      }

      const input = inputRef.current;
      if (!input) {
        if (attempts++ < 40) {
          timer = window.setTimeout(tick, 50);
        }
        return;
      }

      if (handoffToInput(input, pending)) {
        clearPendingFiles();
        doneRef.current = true;
        return;
      }

      // Input present but accept filter rejected — leave payload for other consumers.
      doneRef.current = true;
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [clearPendingFiles, inputRef, peekPendingFiles, shell.slug]);
}

/**
 * Workspace shell variant — finds the primary immersive dropzone file input.
 */
export function usePendingDropzoneHandoff(
  rootRef: React.RefObject<HTMLElement | null>,
) {
  const { peekPendingFiles, clearPendingFiles } = usePendingFiles();
  const shell = useToolPageShell();
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    if (doneRef.current) return;

    let cancelled = false;
    let attempts = 0;
    let timer = 0;
    const toolSlug = shell.slug || undefined;

    const tick = () => {
      if (cancelled || doneRef.current) return;

      const pending = peekPendingFiles({ toolSlug });
      if (!pending?.length) {
        doneRef.current = true;
        return;
      }

      const root = rootRef.current;
      const input = root?.querySelector<HTMLInputElement>(
        '.im-dropzone:not(.im-dropzone--compact) input[type="file"]',
      );

      if (!input) {
        if (attempts++ < 40) {
          timer = window.setTimeout(tick, 50);
        }
        return;
      }

      if (handoffToInput(input, pending)) {
        clearPendingFiles();
        doneRef.current = true;
        return;
      }

      doneRef.current = true;
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [clearPendingFiles, peekPendingFiles, rootRef, shell.slug]);
}
