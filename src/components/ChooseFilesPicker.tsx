"use client";

import { clsx } from "clsx";
import { ChevronUp, FilePlus2, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

export type ChooseFilesPickerLabels = {
  chooseFiles: string;
  fromDevice: string;
  fromDropbox: string;
  fromGoogleDrive: string;
  fromOneDrive: string;
};

type ChooseFilesPickerProps = {
  labels: ChooseFilesPickerLabels;
  disabled?: boolean;
  onPickDevice: () => void;
  onCloudOption: (provider: "Dropbox" | "Google Drive" | "OneDrive") => void;
  className?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

const VIEWPORT_MARGIN = 8;

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="choose-files-menu__icon" aria-hidden>
      <path fill="#4285F4" d="M8.1 16.5 2.5 6.9A1.5 1.5 0 0 1 3.8 4.5h6.2l2.4 4.2z" />
      <path fill="#FBBC04" d="m12.4 8.7 5.6 9.6a1.5 1.5 0 0 1-1.3 2.2H8.1l4.3-11.8z" />
      <path fill="#34A853" d="M18 16.5h-5.6L8.1 4.5H14a1.5 1.5 0 0 1 1.3 2.2z" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="choose-files-menu__icon" aria-hidden>
      <path
        fill="#0061FF"
        d="M6.5 4.5 12 8.2l5.5-3.7L23 8.2l-5.5 3.7L23 15.6l-5.5 3.7L12 15.6l-5.5 3.7L1 15.6l5.5-3.7L1 8.2z"
      />
    </svg>
  );
}

function OneDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="choose-files-menu__icon" aria-hidden>
      <path
        fill="#0078D4"
        d="M14.6 8.2a4.6 4.6 0 0 0-8.4 1.7A3.7 3.7 0 0 0 5.7 17h12.1a3.5 3.5 0 0 0 .7-6.9 4.6 4.6 0 0 0-4-2z"
      />
    </svg>
  );
}

function getMenuPosition(trigger: HTMLElement, menuHeight: number): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  // Match the CHOOSE FILES button width exactly — never stretch wider.
  const width = Math.max(1, Math.round(rect.width * 1000) / 1000);
  const isRtl =
    typeof document !== "undefined" &&
    (document.documentElement.getAttribute("dir") === "rtl" ||
      getComputedStyle(document.documentElement).direction === "rtl");
  // Prefer flush alignment under the button; only nudge if it would clip the viewport.
  let left = isRtl ? rect.right - width : rect.left;
  left = Math.min(
    Math.max(VIEWPORT_MARGIN, left),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
  const top = openUp
    ? Math.max(VIEWPORT_MARGIN, rect.top - menuHeight - 6)
    : Math.min(rect.bottom + 6, window.innerHeight - menuHeight - VIEWPORT_MARGIN);

  return { top, left, width, openUp };
}

/**
 * Shared CHOOSE FILES split-button + source menu used by all tool dropzones.
 * Menu is portaled to document.body so overflow:hidden ancestors cannot clip it.
 */
export function ChooseFilesPicker({
  labels,
  disabled = false,
  onPickDevice,
  onCloudOption,
  className,
}: ChooseFilesPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setMenuPosition(null);
  }, []);

  const openMenu = useCallback(() => {
    if (!buttonRef.current) {
      setOpen(true);
      return;
    }
    // Position before first paint so the portaled menu never flashes at (0,0).
    setMenuPosition(getMenuPosition(buttonRef.current, 220));
    setOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      if (!buttonRef.current) return;
      const estimatedHeight = menuRef.current?.offsetHeight || 220;
      setMenuPosition(getMenuPosition(buttonRef.current, estimatedHeight));
    };

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  const stopZoneClick = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      openMenu();
    }
  };

  const menuStyle: CSSProperties | undefined = menuPosition
    ? {
        position: "fixed",
        top: menuPosition.top,
        left: menuPosition.left,
        width: menuPosition.width,
        minWidth: menuPosition.width,
        maxWidth: menuPosition.width,
        right: "auto",
        zIndex: 1000,
        boxSizing: "border-box",
      }
    : undefined;

  const menu =
    mounted && open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            className={clsx(
              "choose-files-menu",
              "choose-files-menu--portal",
              menuPosition?.openUp && "choose-files-menu--up",
            )}
            role="menu"
            aria-label={labels.chooseFiles}
            style={menuStyle}
          >
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="choose-files-menu__item"
                onClick={() => {
                  closeMenu();
                  onPickDevice();
                }}
              >
                <Upload className="choose-files-menu__icon" strokeWidth={1.75} aria-hidden />
                <span>{labels.fromDevice}</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="choose-files-menu__item"
                onClick={() => {
                  closeMenu();
                  onCloudOption("Dropbox");
                }}
              >
                <DropboxIcon />
                <span>{labels.fromDropbox}</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="choose-files-menu__item"
                onClick={() => {
                  closeMenu();
                  onCloudOption("Google Drive");
                }}
              >
                <GoogleDriveIcon />
                <span>{labels.fromGoogleDrive}</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="choose-files-menu__item"
                onClick={() => {
                  closeMenu();
                  onCloudOption("OneDrive");
                }}
              >
                <OneDriveIcon />
                <span>{labels.fromOneDrive}</span>
              </button>
            </li>
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={clsx("choose-files-picker", className)}
      onClick={stopZoneClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        className="choose-files-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (open) closeMenu();
          else openMenu();
        }}
        onKeyDown={onButtonKeyDown}
      >
        <span className="choose-files-btn__main">
          <FilePlus2 className="choose-files-btn__glyph" strokeWidth={2} aria-hidden />
          <span className="choose-files-btn__label">{labels.chooseFiles}</span>
        </span>
        <span className="choose-files-btn__divider" aria-hidden />
        <span className="choose-files-btn__chevron" aria-hidden>
          <ChevronUp
            className={clsx(
              "choose-files-btn__chevron-icon",
              !open && "choose-files-btn__chevron-icon--closed",
            )}
            strokeWidth={2.25}
          />
        </span>
      </button>
      {menu}
    </div>
  );
}
