"use client";

import { clsx } from "clsx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  getMagnifierPreference,
  subscribeMagnifierPreference,
} from "@/lib/magnifier-preference";

export type MagnifierTouchBehavior = "hide" | "toggle";

export type MagnifierShape = "circle" | "rounded";

export type MagnifierProps = {
  children: ReactNode;
  /** Zoom multiplier (default 2). */
  zoom?: number;
  /** Lens diameter / width in px (default 168). */
  size?: number;
  /** Circle or rounded-square Industrial Matte lens. */
  shape?: MagnifierShape;
  /**
   * Touch devices: `hide` (default) avoids hover friction;
   * `toggle` enables tap-to-show / tap-to-hide at the press point.
   */
  touchBehavior?: MagnifierTouchBehavior;
  /** Disable the magnifier entirely. */
  disabled?: boolean;
  className?: string;
  /** Accessible label for the hover region. */
  "aria-label"?: string;
};

type MagnifierContextValue = {
  zoom: number;
  setZoom: (zoom: number) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const MagnifierContext = createContext<MagnifierContextValue | null>(null);

export type MagnifierProviderProps = {
  children: ReactNode;
  /** Default zoom for nested `<Magnifier>` instances that omit `zoom`. */
  zoom?: number;
  enabled?: boolean;
};

export function MagnifierProvider({
  children,
  zoom: initialZoom = 2,
  enabled: initialEnabled = true,
}: MagnifierProviderProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [enabled, setEnabled] = useState(initialEnabled);

  const value = useMemo(
    () => ({ zoom, setZoom, enabled, setEnabled }),
    [zoom, enabled],
  );

  return <MagnifierContext.Provider value={value}>{children}</MagnifierContext.Provider>;
}

export function useMagnifier(): MagnifierContextValue {
  const ctx = useContext(MagnifierContext);
  if (!ctx) {
    throw new Error("useMagnifier must be used within a MagnifierProvider.");
  }
  return ctx;
}

function useOptionalMagnifier(): MagnifierContextValue | null {
  return useContext(MagnifierContext);
}

/** Sitewide loupe visibility toggled from the tool-modal header. */
function useMagnifierPreference(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getMagnifierPreference());
    return subscribeMagnifierPreference(setEnabled);
  }, []);

  return enabled;
}

function useFinePointerHover(): boolean {
  const [fineHover, setFineHover] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFineHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return fineHover;
}

type LensState = {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

const HIDDEN_LENS: LensState = { visible: false, x: 0, y: 0, width: 0, height: 0 };

/** Keep painted pixels on cloned &lt;canvas&gt; nodes (React/DOM clones are blank otherwise). */
function syncCanvasBitmaps(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sources = sourceRoot.querySelectorAll("canvas");
  const clones = cloneRoot.querySelectorAll("canvas");
  sources.forEach((source, index) => {
    const clone = clones[index];
    if (!(clone instanceof HTMLCanvasElement) || source.width === 0 || source.height === 0) return;
    if (clone.width !== source.width) clone.width = source.width;
    if (clone.height !== source.height) clone.height = source.height;
    const ctx = clone.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, clone.width, clone.height);
    try {
      ctx.drawImage(source, 0, 0);
    } catch {
      // Tainted canvas — skip quietly.
    }
  });
}

/**
 * Industrial Matte magnifier — wrap any presentational preview (image / PDF page).
 *
 * Children mount once (refs stay correct). The lens uses a DOM clone + canvas bitmap sync.
 *
 * @example
 * ```tsx
 * <Magnifier zoom={2.5}>
 *   <img src={previewUrl} alt="" />
 * </Magnifier>
 * ```
 */
export function Magnifier({
  children,
  zoom: zoomProp,
  size = 168,
  shape = "circle",
  touchBehavior = "hide",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Magnifiable preview",
}: MagnifierProps) {
  const ctx = useOptionalMagnifier();
  const zoom = zoomProp ?? ctx?.zoom ?? 2;
  const preferenceEnabled = useMagnifierPreference();
  const contextEnabled = (ctx?.enabled ?? true) && preferenceEnabled;

  const fineHover = useFinePointerHover();
  const rootRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const zoomInnerRef = useRef<HTMLDivElement>(null);
  /** Last pointer position over the preview — lets a header toggle re-show the lens in place. */
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [lens, setLens] = useState<LensState>(HIDDEN_LENS);
  const [touchArmed, setTouchArmed] = useState(false);

  const canUseHover = fineHover && !disabled && contextEnabled;
  const canUseTouchToggle = !fineHover && touchBehavior === "toggle" && !disabled && contextEnabled;
  const magnifierActive = canUseHover || (canUseTouchToggle && touchArmed);

  const updateFromPoint = useCallback((clientX: number, clientY: number, show: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);

    setLens({
      visible: show,
      x,
      y,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const hideLens = useCallback(() => {
    setLens((prev) => (prev.visible ? HIDDEN_LENS : prev));
  }, []);

  const onMouseEnter = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      if (!canUseHover) return;
      updateFromPoint(event.clientX, event.clientY, true);
    },
    [canUseHover, updateFromPoint],
  );

  const onMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      if (!canUseHover) return;
      updateFromPoint(event.clientX, event.clientY, true);
    },
    [canUseHover, updateFromPoint],
  );

  const onMouseLeave = useCallback(() => {
    lastPointRef.current = null;
    if (!canUseHover) return;
    hideLens();
  }, [canUseHover, hideLens]);

  const onClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!canUseTouchToggle) return;
      if (fineHover) return;

      event.preventDefault();
      event.stopPropagation();

      if (touchArmed) {
        setTouchArmed(false);
        hideLens();
        return;
      }

      setTouchArmed(true);
      updateFromPoint(event.clientX, event.clientY, true);
    },
    [canUseTouchToggle, fineHover, hideLens, touchArmed, updateFromPoint],
  );

  const onTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!canUseTouchToggle || !touchArmed) return;
      const touch = event.touches[0];
      if (!touch) return;
      updateFromPoint(touch.clientX, touch.clientY, true);
    },
    [canUseTouchToggle, touchArmed, updateFromPoint],
  );

  useEffect(() => {
    if (!magnifierActive) {
      hideLens();
      return;
    }
    // Re-enabled while the pointer is already over the preview — show in place.
    const point = lastPointRef.current;
    if (canUseHover && point) updateFromPoint(point.x, point.y, true);
  }, [canUseHover, hideLens, magnifierActive, updateFromPoint]);

  const showLens = magnifierActive && lens.visible && lens.width > 0 && lens.height > 0;

  // Build / refresh a DOM clone for the lens (keeps React children mounted once).
  useEffect(() => {
    const source = sourceRef.current;
    const zoomInner = zoomInnerRef.current;
    if (!showLens || !source || !zoomInner) {
      if (zoomInner) zoomInner.replaceChildren();
      return;
    }

    const rebuild = () => {
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute("aria-hidden");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.querySelectorAll("a, button, input, select, textarea").forEach((el) => {
        el.setAttribute("tabindex", "-1");
        if (el instanceof HTMLElement) el.style.pointerEvents = "none";
      });
      zoomInner.replaceChildren(clone);
      syncCanvasBitmaps(source, clone);
    };

    rebuild();
    const frame = requestAnimationFrame(() => {
      syncCanvasBitmaps(source, zoomInner);
    });
    return () => cancelAnimationFrame(frame);
  }, [showLens, lens.width, lens.height]);

  // Keep canvas pixels in sync while the lens moves (overlay tools redraw often).
  useEffect(() => {
    if (!showLens) return;
    const source = sourceRef.current;
    const zoomInner = zoomInnerRef.current;
    if (!source || !zoomInner) return;
    syncCanvasBitmaps(source, zoomInner);
  }, [showLens, lens.x, lens.y]);

  const lensStyle = useMemo(() => {
    if (!showLens) return undefined;
    const half = size / 2;
    return {
      width: size,
      height: size,
      transform: `translate3d(${lens.x - half}px, ${lens.y - half}px, 0)`,
    } satisfies CSSProperties;
  }, [lens.x, lens.y, showLens, size]);

  const zoomStyle = useMemo(() => {
    if (!showLens) return undefined;
    const half = size / 2;
    return {
      width: lens.width,
      height: lens.height,
      transform: `translate3d(${half - lens.x * zoom}px, ${half - lens.y * zoom}px, 0) scale(${zoom})`,
    } satisfies CSSProperties;
  }, [lens.height, lens.width, lens.x, lens.y, showLens, size, zoom]);

  return (
    <div
      ref={rootRef}
      className={clsx("magnifier", className)}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onTouchMove={onTouchMove}
      data-magnifier-shape={shape}
      data-magnifier-touch={canUseTouchToggle ? (touchArmed ? "on" : "off") : undefined}
    >
      <div ref={sourceRef} className="magnifier__source">
        {children}
      </div>

      {showLens ? (
        <div
          className={clsx(
            "magnifier__lens",
            shape === "rounded" ? "magnifier__lens--rounded" : "magnifier__lens--circle",
          )}
          style={lensStyle}
          aria-hidden
        >
          <div className="magnifier__zoom" style={zoomStyle}>
            <div ref={zoomInnerRef} className="magnifier__zoom-inner" />
          </div>
        </div>
      ) : null}

      {canUseTouchToggle && !touchArmed ? (
        <p className="magnifier__touch-hint">Tap preview to magnify</p>
      ) : null}
    </div>
  );
}

/**
 * HOC — wrap any preview component with Magnifier defaults.
 *
 * @example
 * ```tsx
 * const PreviewWithZoom = withMagnifier(PreviewArea, { zoom: 2.5 });
 * ```
 */
export function withMagnifier<P extends object>(
  Component: ComponentType<P>,
  options: Omit<MagnifierProps, "children"> = {},
) {
  function MagnifierWrapped(props: P) {
    return (
      <Magnifier {...options}>
        <Component {...props} />
      </Magnifier>
    );
  }

  MagnifierWrapped.displayName = `withMagnifier(${Component.displayName || Component.name || "Component"})`;
  return MagnifierWrapped;
}
