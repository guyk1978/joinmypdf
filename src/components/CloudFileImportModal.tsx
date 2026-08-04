"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ExternalLink, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppOverlayModal } from "@/components/AppOverlayModal";
import {
  cloudProviderConfigured,
  cloudProviderHomeUrl,
  openCloudProviderPicker,
  type CloudProvider,
} from "@/lib/cloud-file-picker";

type CloudFileImportModalProps = {
  open: boolean;
  provider: CloudProvider | null;
  /** When true, picker may return multiple files. */
  multiple?: boolean;
  /** Optional accept string mirrored from the tool file input. */
  accept?: string;
  onClose: () => void;
  onFiles: (files: File[]) => void;
  onPickDevice: () => void;
};

function safeT(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback: string,
  values?: Record<string, string>,
): string {
  try {
    if (typeof t.has === "function" && t.has(key)) {
      return values ? t(key, values) : t(key);
    }
  } catch {
    /* missing message */
  }
  return fallback;
}

/**
 * Cloud import dialog — opens the provider chooser when configured, otherwise
 * guides the user to download then pick the file. Selected files are always
 * delivered through `onFiles` (never stranded in a parent-frame file dialog).
 */
export function CloudFileImportModal({
  open,
  provider,
  multiple = false,
  accept,
  onClose,
  onFiles,
  onPickDevice,
}: CloudFileImportModalProps) {
  const t = useTranslations("Workspace.common");
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const autoTriedRef = useRef<CloudProvider | null>(null);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError("");
      autoTriedRef.current = null;
    }
  }, [open]);

  const deliverFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      onFiles(files);
      onClose();
    },
    [onClose, onFiles],
  );

  const launchChooser = useCallback(async () => {
    if (!provider) return;
    setBusy(true);
    setError("");

    // Google Picker renders in-page; dismiss our overlay first so the picker
    // receives clicks and can close cleanly after selection.
    const dismissOverlayFirst = provider === "Google Drive";
    if (dismissOverlayFirst) {
      onClose();
    }

    try {
      const result = await openCloudProviderPicker(provider, { multiselect: multiple });
      if (result.cancelled) {
        setBusy(false);
        return;
      }
      if (result.error && !result.files.length) {
        // Never call onPickDevice here — user activation is gone and it
        // triggers "File chooser dialog can only be shown with a user activation".
        if (!dismissOverlayFirst) {
          setError(
            safeT(
              t,
              "cloudPickerFailed",
              result.error ||
                `Could not open ${provider}. Choose the file from this device instead.`,
              { provider },
            ),
          );
        }
        setBusy(false);
        return;
      }
      if (!result.files.length) {
        if (!dismissOverlayFirst) {
          setError(
            safeT(
              t,
              "cloudPickerEmpty",
              `No files returned from ${provider}. Try choosing a file from this device.`,
              { provider },
            ),
          );
        }
        setBusy(false);
        return;
      }
      deliverFiles(result.files);
    } catch {
      if (!dismissOverlayFirst) {
        setError(
          safeT(
            t,
            "cloudPickerFailed",
            `Could not open ${provider}. Choose the file from this device instead.`,
            { provider },
          ),
        );
      }
    } finally {
      setBusy(false);
    }
  }, [deliverFiles, multiple, onClose, provider, t]);

  // Auto-open native chooser once when keys are configured.
  // Google Drive is launched directly from useCloudFileImport (no overlay),
  // so skip auto-open here to avoid re-opening a second picker.
  useEffect(() => {
    if (!open || !provider) return;
    if (provider === "Google Drive") return;
    if (!cloudProviderConfigured(provider)) return;
    if (autoTriedRef.current === provider) return;
    autoTriedRef.current = provider;
    void launchChooser();
  }, [launchChooser, open, provider]);

  const configured = provider ? cloudProviderConfigured(provider) : false;
  // Never deep-link to drive.google.com — that abandons the in-app flow.
  // Dropbox/OneDrive may still offer a site link when SDK keys are missing.
  const showExternalHomeLink =
    Boolean(provider) && !configured && provider !== "Google Drive";
  const homeUrl = provider ? cloudProviderHomeUrl(provider) : "#";
  const title = provider
    ? safeT(t, "cloudImportTitle", `Import from ${provider}`, { provider })
    : "Import";
  const body =
    provider == null
      ? ""
      : provider === "Google Drive" && !configured
        ? safeT(
            t,
            "cloudImportGoogleUnavailableBody",
            "Google Drive picker is unavailable in this build. Choose a file from this device instead — processing stays local in your browser.",
          )
        : configured
          ? safeT(
              t,
              "cloudImportConfiguredBody",
              `Select files in the ${provider} window. They are downloaded into this browser session only — JoinMyPDF never stores them.`,
              { provider },
            )
          : safeT(
              t,
              "cloudImportFallbackBody",
              `Open ${provider}, download the file to this device, then choose it below. Processing stays local in your browser.`,
              { provider },
            );
  const closeLabel = safeT(t, "cloudImportClose", "Close");

  const openLocalFilePicker = () => {
    // Prefer the modal-owned input so the selection stays in this React tree
    // (overlay is portaled to the top frame; tool input.click() is unreliable).
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
      return;
    }
    onClose();
    window.setTimeout(() => onPickDevice(), 40);
  };

  return (
    <AppOverlayModal
      open={open && provider != null}
      title={title}
      onClose={onClose}
      closeLabel={closeLabel}
    >
      {provider ? (
        <>
          <p className="app-overlay-modal__text">{body}</p>
          {error ? (
            <p className="app-overlay-modal__error" role="alert">
              {error}
            </p>
          ) : null}

          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={accept || undefined}
            multiple={multiple}
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const list = event.target.files;
              if (!list?.length) return;
              deliverFiles(Array.from(list));
              event.target.value = "";
            }}
          />

          <div className="app-overlay-modal__actions">
            {configured ? (
              <button
                type="button"
                className="app-overlay-modal__btn app-overlay-modal__btn--primary"
                disabled={busy}
                onClick={() => void launchChooser()}
              >
                {busy
                  ? safeT(t, "cloudImportOpening", `Opening ${provider}…`, { provider })
                  : safeT(t, "cloudImportOpenPicker", `Open ${provider} picker`, {
                      provider,
                    })}
              </button>
            ) : showExternalHomeLink ? (
              <a
                className="app-overlay-modal__btn app-overlay-modal__btn--primary"
                href={homeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
                <span>
                  {safeT(t, "cloudImportOpenSite", `Open ${provider}`, { provider })}
                </span>
              </a>
            ) : null}

            <button
              type="button"
              className="app-overlay-modal__btn app-overlay-modal__btn--secondary"
              disabled={busy}
              onClick={openLocalFilePicker}
            >
              <FolderOpen size={16} strokeWidth={2.25} aria-hidden />
              <span>
                {safeT(t, "cloudImportFromDevice", "Choose file from this device")}
              </span>
            </button>
          </div>
        </>
      ) : null}
    </AppOverlayModal>
  );
}
