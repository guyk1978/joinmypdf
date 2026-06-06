import type { ReactNode } from "react";
import { clsx } from "clsx";
import { matteSecurityCallout, toolUploadStack } from "@/lib/tool-ui";

type WorkspaceUploadShellProps = {
  securePrefix: string;
  privacyNote: ReactNode;
  children: ReactNode;
  className?: string;
  showBanner?: boolean;
};

/** Aligns the security callout and upload dropzone to the same industrial-matte width. */
export function WorkspaceUploadShell({
  securePrefix,
  privacyNote,
  children,
  className,
  showBanner = true,
}: WorkspaceUploadShellProps) {
  return (
    <div className={clsx(toolUploadStack, className)}>
      {showBanner ? (
        <div className={matteSecurityCallout} role="note">
          <strong className="font-semibold">{securePrefix}</strong> {privacyNote}
        </div>
      ) : null}
      {children}
    </div>
  );
}
