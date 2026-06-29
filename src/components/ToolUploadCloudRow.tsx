"use client";

import { useTranslations } from "next-intl";

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M8.1 16.5 2.5 6.9A1.5 1.5 0 0 1 3.8 4.5h6.2l2.4 4.2z" />
      <path fill="#FBBC04" d="m12.4 8.7 5.6 9.6a1.5 1.5 0 0 1-1.3 2.2H8.1l4.3-11.8z" />
      <path fill="#34A853" d="M18 16.5h-5.6L8.1 4.5H14a1.5 1.5 0 0 1 1.3 2.2z" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill="#0061FF"
        d="M6.5 4.5 12 8.2l5.5-3.7L23 8.2l-5.5 3.7L23 15.6l-5.5 3.7L12 15.6l-5.5 3.7L1 15.6l5.5-3.7L1 8.2z"
      />
    </svg>
  );
}

/** Decorative cloud-provider row matching the professional tool upload mockup. */
export function ToolUploadCloudRow() {
  const common = useTranslations("Workspace.common");

  return (
    <div className="tool-upload-zone__cloud-row">
      <span className="tool-upload-zone__cloud-link">
        <GoogleDriveIcon />
        <span>{common("uploadFromGoogleDrive")}</span>
      </span>
      <span className="tool-upload-zone__cloud-link">
        <DropboxIcon />
        <span>{common("uploadFromDropbox")}</span>
      </span>
    </div>
  );
}
