"use client";

import { clsx } from "clsx";
import { ChevronUp, FilePlus2, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

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

/**
 * Shared CHOOSE FILES split-button + source menu used by all tool dropzones.
 */
export function ChooseFilesPicker({
  labels,
  disabled = false,
  onPickDevice,
  onCloudOption,
  className,
}: ChooseFilesPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
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
      setOpen(true);
    }
  };

  return (
    <div
      ref={rootRef}
      className={clsx("choose-files-picker", className)}
      onClick={stopZoneClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="choose-files-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
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

      {open ? (
        <ul className="choose-files-menu" role="menu" aria-label={labels.chooseFiles}>
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
        </ul>
      ) : null}
    </div>
  );
}
