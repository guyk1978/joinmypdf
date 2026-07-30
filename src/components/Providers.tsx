"use client";

import { Suspense, type ReactNode } from "react";
import { EmailPopupScript } from "@/components/EmailPopupScript";
import { PreviewInspectHost } from "@/components/PreviewInspectHost";
import { ToolsDirectoryBatchPinBar } from "@/components/ToolsDirectoryBatchPinBar";
import { ToolsDirectorySelectionProvider } from "@/components/ToolsDirectorySelectionContext";
import { ToolModalProvider } from "@/components/tool-modal/ToolModalProvider";
import { ViewportHistoryRecovery } from "@/components/ViewportHistoryRecovery";
import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { ProjectToastProvider } from "@/context/ProjectToastContext";
import { PostHogProvider } from "@/components/PostHogProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PendingFilesProvider>
        <ProjectToastProvider>
          <Suspense fallback={null}>
            <ToolModalProvider>
              <ToolsDirectorySelectionProvider>
                <ViewportHistoryRecovery />
                <div className="min-h-screen w-full max-w-[100vw] overflow-x-clip">
                  <EmailPopupScript />
                  <PreviewInspectHost />
                  {children}
                  <ToolsDirectoryBatchPinBar />
                </div>
              </ToolsDirectorySelectionProvider>
            </ToolModalProvider>
          </Suspense>
        </ProjectToastProvider>
      </PendingFilesProvider>
    </PostHogProvider>
  );
}
