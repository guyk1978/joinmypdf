"use client";

import { canvasToPngBytes, createTypedSignaturePng } from "@/lib/pdf-sign";
import { getAppOverlayPortalRoot } from "@/components/AppOverlayModal";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

type Tab = "draw" | "type";

const INLINE_W = 360;
const INLINE_H = 120;
const LARGE_W = 960;
const LARGE_H = 320;

function canvasHasInk(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i]! > 0) return true;
  }
  return false;
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function copyCanvas(from: HTMLCanvasElement, to: HTMLCanvasElement) {
  const ctx = to.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, to.width, to.height);
  ctx.drawImage(from, 0, 0, to.width, to.height);
}

function useDrawPad(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const pointerPos = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = pointerPos(event);
  };

  const moveDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const p = pointerPos(event);
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = canvas.width >= 600 ? 3.25 : 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  };

  const endDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  return { startDraw, moveDraw, endDraw };
}

/**
 * Large fixed draw overlay — portaled to document body so it cannot scroll/drift
 * with the tool layout. Optional; sidebar pad still works alone.
 */
function SignatureDrawEnlarge({
  open,
  sourceRef,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  sourceRef: RefObject<HTMLCanvasElement | null>;
  onClose: () => void;
  onSave: (canvas: HTMLCanvasElement) => void | Promise<void>;
  busy: boolean;
}) {
  const t = useTranslations("Workspaces.sign.ui");
  const padRef = useRef<HTMLCanvasElement>(null);
  const { startDraw, moveDraw, endDraw } = useDrawPad(padRef);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setPortalRoot(getAppOverlayPortalRoot());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLocalError("");
    const id = window.requestAnimationFrame(() => {
      const large = padRef.current;
      const source = sourceRef.current;
      if (!large) return;
      if (source && canvasHasInk(source)) {
        copyCanvas(source, large);
      } else {
        clearCanvas(large);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, sourceRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  if (!open || !portalRoot) return null;

  const save = async () => {
    const canvas = padRef.current;
    if (!canvas) return;
    if (!canvasHasInk(canvas)) {
      setLocalError(t("drawFirst"));
      return;
    }
    setLocalError("");
    const source = sourceRef.current;
    if (source) copyCanvas(canvas, source);
    await onSave(canvas);
  };

  return createPortal(
    <div className="sign-draw-overlay" role="presentation" data-app-overlay="1">
      <button
        type="button"
        className="sign-draw-overlay__backdrop"
        aria-label={t("modalClose")}
        onClick={onClose}
      />
      <div
        className="sign-draw-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("enlargePadTitle")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sign-draw-overlay__header">
          <h3 className="sign-draw-overlay__title">{t("enlargePadTitle")}</h3>
          <button
            type="button"
            className="sign-draw-overlay__close"
            aria-label={t("modalClose")}
            onClick={onClose}
          >
            <X size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
        <p className="sign-draw-overlay__hint">{t("drawHint")}</p>
        <canvas
          ref={padRef}
          className="sign-pad sign-pad--large"
          width={LARGE_W}
          height={LARGE_H}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
        />
        {localError ? (
          <p className="sign-creator__error" role="alert">
            {localError}
          </p>
        ) : null}
        <div className="sign-draw-overlay__actions">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => {
              clearCanvas(padRef.current);
              setLocalError("");
            }}
          >
            {t("clearPad")}
          </button>
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void save()}
          >
            {t("useSignature")}
          </button>
        </div>
      </div>
    </div>,
    portalRoot,
  );
}

/**
 * Fixed signature creator for the Sign PDF sidebar — Draw / Type pad stays
 * in-document under "Your Signatures". Optional enlarge overlay for a bigger draw pad.
 */
export function SignatureCreator({
  onSave,
}: {
  onSave: (pngBytes: Uint8Array, label: string) => void | Promise<void>;
}) {
  const t = useTranslations("Workspaces.sign.ui");
  const baseId = useId();
  const [tab, setTab] = useState<Tab>("draw");
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [enlargeOpen, setEnlargeOpen] = useState(false);
  const padRef = useRef<HTMLCanvasElement>(null);
  const { startDraw, moveDraw, endDraw } = useDrawPad(padRef);

  const resetPad = useCallback(() => {
    clearCanvas(padRef.current);
  }, []);

  useEffect(() => {
    requestAnimationFrame(resetPad);
  }, [resetPad]);

  useEffect(() => {
    if (tab !== "draw") return;
    requestAnimationFrame(resetPad);
  }, [tab, resetPad]);

  const afterSave = () => {
    setError("");
    setTypedName("");
    resetPad();
    setEnlargeOpen(false);
  };

  const saveFromCanvas = async (canvas: HTMLCanvasElement) => {
    setBusy(true);
    setError("");
    try {
      const bytes = await canvasToPngBytes(canvas);
      await onSave(bytes, t("drawnSignatureLabel"));
      afterSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const saveDraw = async () => {
    const canvas = padRef.current;
    if (!canvas) return;
    if (!canvasHasInk(canvas)) {
      setError(t("drawFirst"));
      return;
    }
    await saveFromCanvas(canvas);
  };

  const saveType = async () => {
    if (!typedName.trim()) {
      setError(t("typeLabel"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bytes = await createTypedSignaturePng(typedName);
      await onSave(bytes, typedName.trim());
      afterSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sign-creator" aria-labelledby={`${baseId}-title`}>
      <h3 id={`${baseId}-title`} className="sign-creator__title">
        {t("modalTitle")}
      </h3>

      <div className="sign-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "draw"}
          className={`sign-tabs__btn${tab === "draw" ? " is-active" : ""}`}
          onClick={() => {
            setTab("draw");
            setError("");
            setEnlargeOpen(false);
          }}
        >
          {t("tabDraw")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "type"}
          className={`sign-tabs__btn${tab === "type" ? " is-active" : ""}`}
          onClick={() => {
            setTab("type");
            setError("");
            setEnlargeOpen(false);
          }}
        >
          {t("tabType")}
        </button>
      </div>

      {tab === "draw" ? (
        <div className="sign-tab-panel">
          <p className="sign-tab-panel__hint">{t("drawHint")}</p>
          <div className="sign-pad-wrap">
            <canvas
              ref={padRef}
              className="sign-pad sign-pad--inline"
              width={INLINE_W}
              height={INLINE_H}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
            />
            <button
              type="button"
              className="sign-pad__enlarge"
              onClick={() => setEnlargeOpen(true)}
              title={t("enlargePad")}
              aria-label={t("enlargePad")}
            >
              <Maximize2 size={16} strokeWidth={2.25} aria-hidden />
              <span>{t("enlargePad")}</span>
            </button>
          </div>
          <button type="button" className="btn btn--ghost sign-pad__clear" onClick={resetPad}>
            {t("clearPad")}
          </button>
        </div>
      ) : (
        <div className="sign-tab-panel">
          <label className="sign-tab-panel__label" htmlFor={`${baseId}-name`}>
            {t("typeLabel")}
          </label>
          <input
            id={`${baseId}-name`}
            className="sign-type-input"
            type="text"
            placeholder={t("typePlaceholder")}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
          <p className="sign-type-preview" aria-hidden="true">
            {typedName.trim() || t("typePreview")}
          </p>
        </div>
      )}

      {error ? (
        <p className="sign-creator__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--primary sign-creator__save"
        disabled={busy}
        onClick={() => void (tab === "draw" ? saveDraw() : saveType())}
      >
        {t("useSignature")}
      </button>

      <SignatureDrawEnlarge
        open={enlargeOpen}
        sourceRef={padRef}
        busy={busy}
        onClose={() => setEnlargeOpen(false)}
        onSave={saveFromCanvas}
      />
    </div>
  );
}

/** @deprecated Prefer SignatureCreator inline in the library panel. */
export function SignatureModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (pngBytes: Uint8Array, label: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="sign-modal" role="dialog" aria-modal="true">
      <button type="button" className="sign-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="sign-modal__panel glass">
        <SignatureCreator
          onSave={async (bytes, label) => {
            onSave(bytes, label);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
