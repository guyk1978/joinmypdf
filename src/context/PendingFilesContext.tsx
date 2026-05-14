"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  setPendingFiles: (files: File[] | null) => void;
  consumePendingFiles: () => File[] | null;
};

const PendingFilesContext = createContext<Ctx | null>(null);

export function PendingFilesProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<File[] | null>(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const setPendingFiles = useCallback(
    (files: File[] | null) => {
      pendingRef.current = files;
      bump();
    },
    [bump]
  );

  const consumePendingFiles = useCallback(() => {
    const next = pendingRef.current;
    pendingRef.current = null;
    bump();
    return next;
  }, [bump]);

  const value = useMemo(
    () => ({
      setPendingFiles,
      consumePendingFiles,
    }),
    [setPendingFiles, consumePendingFiles]
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
