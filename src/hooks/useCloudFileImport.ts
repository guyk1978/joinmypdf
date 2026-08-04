"use client";

import {
  createElement,
  useCallback,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { CloudFileImportModal } from "@/components/CloudFileImportModal";
import {
  findFileInput,
  injectFilesIntoToolRoot,
} from "@/lib/assign-files-to-input";
import type { CloudProvider } from "@/lib/cloud-file-picker";

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

  const openCloudImport = useCallback((next: CloudProvider) => {
    setProvider(next);
  }, []);

  const closeCloudImport = useCallback(() => setProvider(null), []);

  const handleCloudFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;

      // 1) Direct sink (preferred when the tool owns an onFiles handler).
      if (onFiles) {
        onFiles(files);
        return;
      }

      // 2) Same path as a local device upload: assign onto the hidden <input>
      //    so the tool's existing onChange / addFile pipeline runs.
      if (injectFilesIntoToolRoot(rootRef.current, files)) {
        return;
      }

      // 3) Last resort — open the native device picker.
      onPickDevice();
    },
    [onFiles, onPickDevice, rootRef],
  );

  const resolvedMultiple =
    multiple || Boolean(findFileInput(rootRef.current)?.multiple);
  const resolvedAccept = accept || findFileInput(rootRef.current)?.accept || undefined;

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
