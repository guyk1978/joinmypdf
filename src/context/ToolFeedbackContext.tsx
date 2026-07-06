"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { buildFeedbackFileContext } from "@/lib/feedback-file-context";

type ToolFeedbackContextValue = {
  fileContext?: string;
  setFileContext: (value?: string) => void;
  registerFile: (file: File | null | undefined, slug?: string, outputLabel?: string) => void;
};

const ToolFeedbackContext = createContext<ToolFeedbackContextValue | null>(null);

export function ToolFeedbackProvider({ children }: { children: ReactNode }) {
  const [fileContext, setFileContext] = useState<string | undefined>();

  const value = useMemo<ToolFeedbackContextValue>(
    () => ({
      fileContext,
      setFileContext,
      registerFile: (file, slug, outputLabel) => {
        if (!file) {
          setFileContext(undefined);
          return;
        }
        setFileContext(buildFeedbackFileContext(file, { slug, outputLabel }));
      },
    }),
    [fileContext],
  );

  return <ToolFeedbackContext.Provider value={value}>{children}</ToolFeedbackContext.Provider>;
}

export function useToolFeedback() {
  const context = useContext(ToolFeedbackContext);
  if (!context) {
    return {
      fileContext: undefined,
      setFileContext: () => undefined,
      registerFile: () => undefined,
    };
  }
  return context;
}
