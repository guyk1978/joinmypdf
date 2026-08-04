"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { usePathname } from "@/i18n/navigation";
import {
  ToolModalContext,
  EMPTY_TOOL_MODAL_ACTIONS,
  type OpenToolModalOptions,
  type ToolModalContextValue,
} from "@/components/tool-modal/tool-modal-context";

type HeavyProviderProps = {
  children: ReactNode;
  pendingOpen?: OpenToolModalOptions | null;
};

/**
 * Keeps the tools registry / modal chrome off the welcome-splash critical path.
 * Loads eagerly on tool deep-links, on idle for app routes, and never on `/`.
 */
export function DeferredToolModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [Heavy, setHeavy] = useState<ComponentType<HeavyProviderProps> | null>(null);
  const pendingOpenRef = useRef<OpenToolModalOptions | null>(null);
  const loadingRef = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (Heavy || loadingRef.current) return;
    loadingRef.current = true;
    void import("@/components/tool-modal/ToolModalProvider").then((mod) => {
      setHeavy(() => mod.ToolModalProvider as ComponentType<HeavyProviderProps>);
    });
  }, [Heavy]);

  useEffect(() => {
    // Welcome splash — do not prefetch the modal/registry chunk.
    if (pathname === "/" || pathname === "") return;

    const underTools = pathname.startsWith("/tools/");
    if (underTools) {
      ensureLoaded();
      return;
    }

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const start = () => ensureLoaded();

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(start, 2200);
    }

    return () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [pathname, ensureLoaded]);

  const stubValue = useMemo<ToolModalContextValue>(
    () => ({
      openToolModal: (options) => {
        pendingOpenRef.current = options;
        ensureLoaded();
      },
      closeToolModal: () => {},
      isOpen: false,
      session: null,
      registerSession: () => {},
      actions: EMPTY_TOOL_MODAL_ACTIONS,
    }),
    [ensureLoaded],
  );

  // Apply a queued open once the heavy provider mounts.
  useEffect(() => {
    if (!Heavy || !pendingOpenRef.current) return;
    // Heavy provider reads pending via prop on first paint; clear after handoff.
    const t = window.setTimeout(() => {
      pendingOpenRef.current = null;
    }, 0);
    return () => window.clearTimeout(t);
  }, [Heavy]);

  if (!Heavy) {
    return (
      <ToolModalContext.Provider value={stubValue}>
        {children}
      </ToolModalContext.Provider>
    );
  }

  return (
    <Heavy pendingOpen={pendingOpenRef.current}>{children}</Heavy>
  );
}
