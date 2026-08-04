"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Prefer the topmost same-origin document so embed iframes don't trap overlays. */
export function getAppOverlayPortalRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  try {
    if (window.top && window.top !== window) {
      const topBody = window.top.document?.body;
      if (topBody) return topBody;
    }
  } catch {
    /* cross-origin — fall through */
  }
  try {
    if (window.parent && window.parent !== window) {
      const parentBody = window.parent.document?.body;
      if (parentBody) return parentBody;
    }
  } catch {
    /* cross-origin — fall through */
  }
  return document.body;
}

const STYLE_TAG_ID = "joinmypdf-app-overlay-modal-css";

/** Ensure panel CSS exists even when portaling into a parent frame that hasn't hot-reloaded. */
function ensureOverlayCss(doc: Document) {
  if (doc.getElementById(STYLE_TAG_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `
.app-overlay-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;display:flex!important;align-items:center;justify-content:center;padding:1rem;box-sizing:border-box}
.app-overlay-modal__backdrop{position:absolute!important;inset:0!important;z-index:0!important;border:0;margin:0;padding:0;background:rgba(0,0,0,.58)!important;cursor:pointer}
.app-overlay-modal__panel{position:relative!important;z-index:1!important;display:block!important;visibility:visible!important;opacity:1!important;width:min(26rem,100%);max-height:min(90vh,40rem);overflow:auto;padding:1.15rem 1.2rem 1.25rem;border-radius:.75rem;background:#fff!important;color:#171717!important;box-shadow:0 18px 50px rgba(0,0,0,.35);box-sizing:border-box}
.app-overlay-modal__header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.65rem}
.app-overlay-modal__title{margin:0;font-size:1.05rem;font-weight:700;line-height:1.3;color:#171717!important}
.app-overlay-modal__close{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border:0;border-radius:.4rem;background:transparent;color:#525252;cursor:pointer}
.app-overlay-modal__text{margin:0 0 .85rem;font-size:.9rem;line-height:1.45;color:#404040!important}
.app-overlay-modal__error{margin:0 0 .85rem;font-size:.85rem;color:#b91c1c!important}
.app-overlay-modal__stars{display:flex;justify-content:center;margin:.35rem 0 .85rem}
.app-overlay-modal__actions{display:flex;flex-direction:column;gap:.5rem}
.app-overlay-modal__btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:2.5rem;padding:.55rem .9rem;border-radius:.5rem;border:1px solid transparent;font-size:.9rem;font-weight:650;text-decoration:none;cursor:pointer;box-sizing:border-box}
.app-overlay-modal__btn--primary{background:#171717!important;color:#fff!important}
.app-overlay-modal__btn--secondary{background:#f5f5f5!important;border-color:#e5e5e5;color:#171717!important}
`;
  doc.head.appendChild(style);
}

const shellStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  boxSizing: "border-box",
};

const backdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: 0,
  margin: 0,
  padding: 0,
  background: "rgba(0, 0, 0, 0.58)",
  cursor: "pointer",
  zIndex: 0,
};

const panelStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(26rem, 100%)",
  maxHeight: "min(90vh, 40rem)",
  overflow: "auto",
  padding: "1.15rem 1.2rem 1.25rem",
  borderRadius: "0.75rem",
  background: "#ffffff",
  color: "#171717",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
  boxSizing: "border-box",
};

type AppOverlayModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional footer actions below the body. */
  footer?: ReactNode;
  closeLabel?: string;
};

/**
 * Full-viewport overlay dialog that always mounts on the topmost same-origin
 * document body — so tool-embed iframes can't hide the panel behind a lone veil.
 */
export function AppOverlayModal({
  open,
  title,
  onClose,
  children,
  footer,
  closeLabel = "Close",
}: AppOverlayModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = getAppOverlayPortalRoot();
    if (root?.ownerDocument) ensureOverlayCss(root.ownerDocument);
    setPortalRoot(root);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key !== "Escape") return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      onClose();
    };

    const docs: Document[] = [document];
    try {
      if (window.top && window.top !== window && window.top.document) {
        docs.push(window.top.document);
      }
    } catch {
      /* ignore */
    }

    for (const doc of docs) {
      doc.addEventListener("keydown", onKeyDown, true);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      for (const doc of docs) {
        doc.removeEventListener("keydown", onKeyDown, true);
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !portalRoot) return null;

  const stopPanel = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className="app-overlay-modal"
      role="presentation"
      style={shellStyle}
      data-app-overlay="1"
    >
      <button
        type="button"
        className="app-overlay-modal__backdrop"
        style={backdropStyle}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        className="app-overlay-modal__panel"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={stopPanel}
      >
        <div className="app-overlay-modal__header">
          <h2 className="app-overlay-modal__title">{title}</h2>
          <button
            type="button"
            className="app-overlay-modal__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
        <div className="app-overlay-modal__body">{children}</div>
        {footer ? <div className="app-overlay-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    portalRoot,
  );
}
