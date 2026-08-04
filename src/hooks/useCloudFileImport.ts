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
  assignFilesToInput,
  findFileInput,
} from "@/lib/assign-files-to-input";
import type { CloudProvider } from "@/lib/cloud-file-picker";

type UseCloudFileImportOptions = {
  /** Root that contains the hidden file input (dropzone shell). */
  rootRef: RefObject<HTMLElement | null>;
  /** Fallback when input injection is unavailable. */
  onPickDevice: () => void;
  /** Optional direct file sink (ChooseFilesDropzone). */
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
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
      if (onFiles) {
        onFiles(files);
        return;
      }
      const input = findFileInput(rootRef.current);
      if (input && assignFilesToInput(input, files)) return;
      onPickDevice();
    },
    [onFiles, onPickDevice, rootRef],
  );

  const cloudImportModal = createElement(CloudFileImportModal, {
    open: provider != null,
    provider,
    multiple,
    onClose: closeCloudImport,
    onFiles: handleCloudFiles,
    onPickDevice,
  });

  return { openCloudImport, cloudImportModal };
}
