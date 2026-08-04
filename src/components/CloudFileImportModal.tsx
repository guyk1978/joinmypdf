"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * guides the user to download then pick the file from their device.
 */
export function CloudFileImportModal({
  open,
  provider,
  multiple = false,
  onClose,
  onFiles,
  onPickDevice,
}: CloudFileImportModalProps) {
  const t = useTranslations("Workspace.common");
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

  const launchChooser = useCallback(async () => {
    if (!provider) return;
    setBusy(true);
    setError("");
    try {
      const result = await openCloudProviderPicker(provider, { multiselect: multiple });
      if (result.cancelled) {
        setBusy(false);
        return;
      }
      if (!result.files.length) {
        setError(
          safeT(
            t,
            "cloudPickerEmpty",
            `No files returned from ${provider}. Try choosing a file from this device.`,
            { provider },
          ),
        );
        setBusy(false);
        return;
      }
      onFiles(result.files);
      onClose();
    } catch {
      setError(
        safeT(
          t,
          "cloudPickerFailed",
          `Could not open ${provider}. Choose the file from this device instead.`,
          { provider },
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [multiple, onClose, onFiles, provider, t]);

  // Auto-open native chooser once when keys are configured.
  useEffect(() => {
    if (!open || !provider) return;
    if (!cloudProviderConfigured(provider)) return;
    if (autoTriedRef.current === provider) return;
    autoTriedRef.current = provider;
    void launchChooser();
  }, [launchChooser, open, provider]);

  const configured = provider ? cloudProviderConfigured(provider) : false;
  const homeUrl = provider ? cloudProviderHomeUrl(provider) : "#";
  const title = provider
    ? safeT(t, "cloudImportTitle", `Import from ${provider}`, { provider })
    : "Import";
  const body =
    provider == null
      ? ""
      : configured
        ? safeT(
            t,
            "cloudImportConfiguredBody",
            `Select files in the ${provider} window. They stay on your device after download — JoinMyPDF never stores them.`,
            { provider },
          )
        : safeT(
            t,
            "cloudImportFallbackBody",
            `Open ${provider}, download the file to this device, then choose it below. Processing stays local in your browser.`,
            { provider },
          );
  const closeLabel = safeT(t, "cloudImportClose", "Close");

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
            ) : (
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
            )}

            <button
              type="button"
              className="app-overlay-modal__btn app-overlay-modal__btn--secondary"
              disabled={busy}
              onClick={() => {
                onClose();
                window.setTimeout(() => onPickDevice(), 40);
              }}
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
