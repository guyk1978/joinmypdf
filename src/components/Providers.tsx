"use client";

import { EmailPopupScript } from "@/components/EmailPopupScript";
import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PendingFilesProvider>
        <EmailPopupScript />
        {children}
      </PendingFilesProvider>
    </PostHogProvider>
  );
}
