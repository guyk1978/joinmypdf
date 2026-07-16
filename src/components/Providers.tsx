"use client";

import { EmailPopupScript } from "@/components/EmailPopupScript";
import { ToolModalProvider } from "@/components/tool-modal/ToolModalProvider";
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
            <div className="min-h-screen">
              <EmailPopupScript />
              {children}
            </div>
          </ToolModalProvider>
        </ProjectToastProvider>
      </PendingFilesProvider>
    </PostHogProvider>
  );
}
