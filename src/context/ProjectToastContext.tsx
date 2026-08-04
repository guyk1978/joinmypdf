"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PROJECT_SAVED_MESSAGE } from "@/lib/workspace-project-messages";

type ProjectToastContextValue = {
  showToast: (message: string) => void;
};

const ProjectToastContext = createContext<ProjectToastContextValue | null>(null);

export function ProjectToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  // Tool iframes save into IndexedDB then notify the parent so the toast appears above the modal.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== PROJECT_SAVED_MESSAGE) return;
      const next = (data as { message?: string }).message;
      if (typeof next === "string" && next.trim()) setMessage(next.trim());
    };
    const onCustom = (event: Event) => {
      const next = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (typeof next === "string" && next.trim()) setMessage(next.trim());
    };
    window.addEventListener("message", onMessage);
    window.addEventListener(PROJECT_SAVED_MESSAGE, onCustom);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(PROJECT_SAVED_MESSAGE, onCustom);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ProjectToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="project-toast" role="status" aria-live="polite">
          {message}
        </div>
      ) : null}
    </ProjectToastContext.Provider>
  );
}

export function useProjectToast() {
  const ctx = useContext(ProjectToastContext);
  if (!ctx) {
    throw new Error("useProjectToast must be used within ProjectToastProvider");
  }
  return ctx;
}

/** @deprecated Prefer useProjectToast — kept for hot-reload compatibility. */
export function useOptionalProjectToast() {
  return useContext(ProjectToastContext);
}
