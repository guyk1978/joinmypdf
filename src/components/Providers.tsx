"use client";

import { EmailPopupScript } from "@/components/EmailPopupScript";
import { PreviewInspectHost } from "@/components/PreviewInspectHost";
import { ToolModalProvider } from "@/components/tool-modal/ToolModalProvider";
import { ViewportHistoryRecovery } from "@/components/ViewportHistoryRecovery";
import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { ProjectToastProvider } from "@/context/ProjectToastContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PendingFilesProvider>
        <ProjectToastProvider>
          <ToolModalProvider>
            <ViewportHistoryRecovery />
            <div className="min-h-screen w-full max-w-[100vw] overflow-x-clip">
              <EmailPopupScript />
              <PreviewInspectHost />
              {children}
            </div>
          </ToolModalProvider>
        </ProjectToastProvider>
      </PendingFilesProvider>
    </PostHogProvider>
  );
}
