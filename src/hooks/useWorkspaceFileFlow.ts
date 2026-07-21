"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import {
  getWorkspacePhaseFromSignal,
  scrollToWorkspaceOperations,
  scrollToWorkspaceUpload,
  setWorkspacePhase,
} from "@/lib/workspace-flow";

export function useWorkspaceFileFlow(
  inputRef: RefObject<HTMLInputElement | null>,
  fileSignal: boolean | number,
) {
  const previousSignal = useRef(fileSignal);

  useLayoutEffect(() => {
    setWorkspacePhase(getWorkspacePhaseFromSignal(fileSignal));
  }, [fileSignal]);

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

  useEffect(() => {
    return () => {
      // Only unlock if no clean upload shell is still mounted (avoids racing
      // WorkspaceUploadShell and collapsing the immersive dropzone).
      const cleanFloat = document.querySelector(
        '.tool-upload-float[data-workspace-phase="clean"]',
      );
      if (!cleanFloat) {
        setWorkspacePhase("active");
      }
    };
  }, []);

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
