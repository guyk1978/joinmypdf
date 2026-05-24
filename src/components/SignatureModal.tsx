"use client";

import { canvasToPngBytes, createTypedSignaturePng } from "@/lib/pdf-sign";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Tab = "draw" | "type";

export function SignatureModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (pngBytes: Uint8Array, previewUrl: string) => void;
}) {
  const baseId = useId();
  const [tab, setTab] = useState<Tab>("draw");
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const padRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const resetPad = useCallback(() => {
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    setTab("draw");
    setTypedName("");
    requestAnimationFrame(resetPad);
  }, [open, resetPad]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const pointerPos = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = pointerPos(event);
  };

  const moveDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = padRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const p = pointerPos(event);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
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
      padRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const saveDraw = async () => {
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        hasInk = true;
        break;
      }
    }
    if (!hasInk) {
      setError("Draw your signature on the pad first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bytes = await canvasToPngBytes(canvas);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" }));
      onSave(bytes, url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save signature.");
    } finally {
      setBusy(false);
    }
  };

  const saveType = async () => {
    setBusy(true);
    setError("");
    try {
      const bytes = await createTypedSignaturePng(typedName);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" }));
      onSave(bytes, url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create signature.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="sign-modal" role="dialog" aria-modal="true" aria-labelledby={`${baseId}-title`}>
      <button type="button" className="sign-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="sign-modal__panel glass">
        <h2 id={`${baseId}-title`} className="sign-modal__title">
          Create your signature
        </h2>
        <div className="sign-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "draw"}
            className={`sign-tabs__btn${tab === "draw" ? " is-active" : ""}`}
            onClick={() => setTab("draw")}
          >
            Draw
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "type"}
            className={`sign-tabs__btn${tab === "type" ? " is-active" : ""}`}
            onClick={() => setTab("type")}
          >
            Type
          </button>
        </div>

        {tab === "draw" ? (
          <div className="sign-tab-panel">
            <p className="sign-tab-panel__hint">Use your mouse or finger to draw your signature.</p>
            <canvas
              ref={padRef}
              className="sign-pad"
              width={520}
              height={160}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
            <button type="button" className="btn btn--ghost sign-pad__clear" onClick={resetPad}>
              Clear pad
            </button>
          </div>
        ) : (
          <div className="sign-tab-panel">
            <label className="sign-tab-panel__label" htmlFor={`${baseId}-name`}>
              Type your name
            </label>
            <input
              id={`${baseId}-name`}
              className="sign-type-input"
              type="text"
              placeholder="Your full name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
            />
            <p className="sign-type-preview" aria-hidden="true">
              {typedName.trim() || "Preview"}
            </p>
          </div>
        )}

        {error ? (
          <p className="sign-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sign-modal__actions">
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void (tab === "draw" ? saveDraw() : saveType())}
          >
            Use signature
          </button>
        </div>
      </div>
    </div>
  );
}
