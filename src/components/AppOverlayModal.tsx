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
  let style = doc.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_TAG_ID;
    doc.head.appendChild(style);
  }
  style.textContent = `
.app-overlay-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;display:flex!important;align-items:center!important;justify-content:center;padding:1rem;box-sizing:border-box}
.app-overlay-modal__backdrop{position:absolute!important;inset:0!important;z-index:0!important;border:0;margin:0;padding:0;background:rgba(0,0,0,.68)!important;cursor:pointer}
.app-overlay-modal__panel{position:relative!important;z-index:1!important;display:block!important;visibility:visible!important;opacity:1!important;width:min(26rem,100%);max-height:min(90vh,40rem);overflow:auto;padding:1.2rem 1.25rem 1.3rem;border:1px solid rgba(52,211,153,.2);border-radius:var(--app-overlay-radius,1.15rem);background:var(--app-overlay-bg,#141414)!important;color:var(--app-overlay-fg,#f5f5f5)!important;box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 22px 56px rgba(0,0,0,.55);box-sizing:border-box}
.app-overlay-modal__header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.65rem}
.app-overlay-modal__title{margin:0;font-size:1.05rem;font-weight:700;line-height:1.3;letter-spacing:-.01em;color:var(--app-overlay-fg,#f5f5f5)!important}
.app-overlay-modal__close{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border:0;border-radius:var(--app-overlay-control-radius,.75rem);background:transparent;color:var(--app-overlay-muted,#a3a3a3);cursor:pointer}
.app-overlay-modal__close:hover{background:var(--app-overlay-close-hover-bg,rgba(255,255,255,.08));color:var(--app-overlay-fg,#f5f5f5)}
.app-overlay-modal__text{margin:0 0 .85rem;font-size:.9rem;line-height:1.45;color:var(--app-overlay-muted,#a3a3a3)!important}
.app-overlay-modal__error{margin:0 0 .85rem;font-size:.85rem;color:#fca5a5!important}
.app-overlay-modal__stars{display:flex;justify-content:center;margin:.35rem 0 .85rem}
.app-overlay-modal__stars .star-rating,.app-overlay-modal__stars [data-star-rating]{color:#34d399!important}
.app-overlay-modal__actions{display:flex;flex-direction:column;gap:.55rem}
.app-overlay-modal__btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:2.55rem;padding:.55rem .9rem;border-radius:var(--app-overlay-control-radius,.75rem);border:1px solid transparent;font-size:.9rem;font-weight:650;letter-spacing:.02em;text-decoration:none;cursor:pointer;box-sizing:border-box}
.app-overlay-modal__btn--primary{background:var(--app-overlay-btn-primary-bg,#34d399)!important;color:var(--app-overlay-btn-primary-fg,#04140e)!important;border-color:rgba(52,211,153,.55);box-shadow:0 0 20px rgba(52,211,153,.22)}
.app-overlay-modal__btn--secondary{background:var(--app-overlay-btn-secondary-bg,rgba(255,255,255,.05))!important;border-color:var(--app-overlay-btn-secondary-border,rgba(255,255,255,.14));color:var(--app-overlay-btn-secondary-fg,#f5f5f5)!important}
.app-overlay-modal--accent .app-overlay-modal__panel,.app-overlay-modal.rate-tool-modal .app-overlay-modal__panel{border-radius:1.15rem}
.app-overlay-modal--accent .app-overlay-modal__close,.app-overlay-modal--accent .app-overlay-modal__btn,.app-overlay-modal.rate-tool-modal .app-overlay-modal__close,.app-overlay-modal.rate-tool-modal .app-overlay-modal__btn{border-radius:.75rem}
`;
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

const panelStyleBase: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(26rem, 100%)",
  maxHeight: "min(90vh, 40rem)",
  overflow: "auto",
  padding: "1.15rem 1.2rem 1.25rem",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
  boxSizing: "border-box",
};

export type AppOverlayModalTone = {
  /** Solid panel fill (hex). */
  background: string;
  /** High-contrast ink for titles / primary text. */
  foreground: string;
  /** Secondary / hint text and close icon. */
  muted: string;
  /** Close button hover fill. */
  closeHoverBackground: string;
  primaryButtonBackground: string;
  primaryButtonForeground: string;
  secondaryButtonBackground: string;
  secondaryButtonBorder: string;
  secondaryButtonForeground: string;
};

type AppOverlayModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional footer actions below the body. */
  footer?: ReactNode;
  closeLabel?: string;
  /**
   * Optional panel tone via CSS variables.
   * Rate-this-tool uses the sitewide industrial dark + emerald tone.
   */
  tone?: AppOverlayModalTone;
  className?: string;
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
  tone,
  className,
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

  const toneVars = tone
    ? ({
        "--app-overlay-bg": tone.background,
        "--app-overlay-fg": tone.foreground,
        "--app-overlay-muted": tone.muted,
        "--app-overlay-close-hover-bg": tone.closeHoverBackground,
        "--app-overlay-radius": "1.15rem",
        "--app-overlay-control-radius": "0.75rem",
        "--app-overlay-btn-primary-bg": tone.primaryButtonBackground,
        "--app-overlay-btn-primary-fg": tone.primaryButtonForeground,
        "--app-overlay-btn-secondary-bg": tone.secondaryButtonBackground,
        "--app-overlay-btn-secondary-border": tone.secondaryButtonBorder,
        "--app-overlay-btn-secondary-fg": tone.secondaryButtonForeground,
        "--star-rating-color": "#34d399",
      } as CSSProperties)
    : undefined;

  const shellClass = ["app-overlay-modal", tone ? "app-overlay-modal--accent" : null, className]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={shellClass}
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
        style={{ ...panelStyleBase, ...toneVars }}
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
