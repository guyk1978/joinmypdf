"use client";

import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { EmailPopupScript } from "@/components/EmailPopupScript";
import { ToolsDirectorySelectionProvider } from "@/components/ToolsDirectorySelectionContext";
import { DeferredToolModalProvider } from "@/components/tool-modal/DeferredToolModalProvider";
import { ViewportHistoryRecovery } from "@/components/ViewportHistoryRecovery";
import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { ProjectToastProvider } from "@/context/ProjectToastContext";
import { PostHogProvider } from "@/components/PostHogProvider";

const PreviewInspectHost = dynamic(
  () =>
    import("@/components/PreviewInspectHost").then((mod) => mod.PreviewInspectHost),
  { ssr: false },
);

const ToolsDirectoryBatchPinBar = dynamic(
  () =>
    import("@/components/ToolsDirectoryBatchPinBar").then(
      (mod) => mod.ToolsDirectoryBatchPinBar,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PendingFilesProvider>
        <ProjectToastProvider>
          <Suspense fallback={null}>
            <DeferredToolModalProvider>
              <ToolsDirectorySelectionProvider>
                <ViewportHistoryRecovery />
                {/* Root sticky-footer flex chain — one min-h-dvh floor only */}
                <div className="flex min-h-dvh w-full max-w-[100vw] flex-col overflow-x-clip">
                  <EmailPopupScript />
                  <PreviewInspectHost />
                  <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
                  <ToolsDirectoryBatchPinBar />
                </div>
              </ToolsDirectorySelectionProvider>
            </DeferredToolModalProvider>
          </Suspense>
        </ProjectToastProvider>
      </PendingFilesProvider>
    </PostHogProvider>
  );
}
