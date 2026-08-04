"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { CloudFileImportModal } from "@/components/CloudFileImportModal";
import {
  findFileInput,
  injectFilesIntoToolRoot,
} from "@/lib/assign-files-to-input";
import {
  cloudProviderConfigured,
  openCloudProviderPicker,
  preloadGoogleDrivePicker,
  type CloudProvider,
} from "@/lib/cloud-file-picker";

type UseCloudFileImportOptions = {
  /** Root that contains the hidden file input (dropzone shell). */
  rootRef: RefObject<HTMLElement | null>;
  /** Fallback when input injection is unavailable. */
  onPickDevice: () => void;
  /** Optional direct file sink (ChooseFilesDropzone / MediaDropzone). */
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
};

/**
 * Shared Dropbox / Google Drive / OneDrive import flow for tool dropzones.
 * Uses createElement (not JSX) so this can live in a `.ts` file.
 */
export function useCloudFileImport({
  rootRef,
  onPickDevice,
  onFiles,
  multiple = false,
  accept,
}: UseCloudFileImportOptions): {
  openCloudImport: (next: CloudProvider) => void;
  cloudImportModal: ReactNode;
} {
  const [provider, setProvider] = useState<CloudProvider | null>(null);
  const launchingRef = useRef(false);

  // Warm Google scripts so the auth popup can open on click without a long await gap.
  useEffect(() => {
    if (!cloudProviderConfigured("Google Drive")) return;
    void preloadGoogleDrivePicker().catch(() => {
      /* logged inside preload */
    });
  }, []);

  const closeCloudImport = useCallback(() => setProvider(null), []);

  const handleCloudFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;

      if (onFiles) {
        onFiles(files);
        return;
      }

      if (injectFilesIntoToolRoot(rootRef.current, files)) {
        return;
      }

      onPickDevice();
    },
    [onFiles, onPickDevice, rootRef],
  );

  const resolvedMultiple =
    multiple || Boolean(findFileInput(rootRef.current)?.multiple);
  const resolvedAccept = accept || findFileInput(rootRef.current)?.accept || undefined;

  const openCloudImport = useCallback(
    (next: CloudProvider) => {
      if (next === "Google Drive" && cloudProviderConfigured(next)) {
        if (launchingRef.current) return;
        launchingRef.current = true;
        setProvider(null);
        // Kick preload immediately within the click turn, then open picker.
        void preloadGoogleDrivePicker().catch(() => undefined);
        void (async () => {
          try {
            const result = await openCloudProviderPicker(next, {
              multiselect: resolvedMultiple,
            });
            if (result.cancelled) return;
            if (result.files.length) {
              handleCloudFiles(result.files);
              return;
            }
            // Auth popup closed / failed — show in-app retry UI (do not open
            // the device file chooser without a fresh user gesture).
            setProvider(next);
          } catch {
            setProvider(next);
          } finally {
            launchingRef.current = false;
          }
        })();
        return;
      }

      setProvider(next);
    },
    [handleCloudFiles, resolvedMultiple],
  );

  const cloudImportModal = createElement(CloudFileImportModal, {
    open: provider != null,
    provider,
    multiple: resolvedMultiple,
    accept: resolvedAccept,
    onClose: closeCloudImport,
    onFiles: handleCloudFiles,
    onPickDevice,
  });

  return { openCloudImport, cloudImportModal };
}
