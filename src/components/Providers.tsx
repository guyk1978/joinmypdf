"use client";

import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PendingFilesProvider>{children}</PendingFilesProvider>
    </PostHogProvider>
  );
}
