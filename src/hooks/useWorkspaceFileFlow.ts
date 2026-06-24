"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { scrollToWorkspaceOperations, scrollToWorkspaceUpload } from "@/lib/workspace-flow";

export function useWorkspaceFileFlow(
  inputRef: RefObject<HTMLInputElement | null>,
  fileSignal: boolean | number,
) {
  const previousSignal = useRef(fileSignal);

  useEffect(() => {
    const hadFiles =
      typeof previousSignal.current === "number"
        ? previousSignal.current > 0
        : Boolean(previousSignal.current);
    const hasFiles =
      typeof fileSignal === "number" ? fileSignal > 0 : Boolean(fileSignal);

    if (!hadFiles && hasFiles) {
      window.setTimeout(scrollToWorkspaceOperations, 100);
    }

    previousSignal.current = fileSignal;
  }, [fileSignal]);

  const startNewUpload = useCallback(
    (reset: () => void) => {
      reset();
      window.setTimeout(() => {
        scrollToWorkspaceUpload();
        inputRef.current?.click();
      }, 150);
    },
    [inputRef],
  );

  return { startNewUpload };
}
