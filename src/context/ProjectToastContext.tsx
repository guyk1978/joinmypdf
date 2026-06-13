"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
