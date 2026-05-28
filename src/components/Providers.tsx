"use client";

import { EmailPopupScript } from "@/components/EmailPopupScript";
import { PendingFilesProvider } from "@/context/PendingFilesContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <PostHogProvider>
        <PendingFilesProvider>
          <EmailPopupScript />
          {children}
        </PendingFilesProvider>
      </PostHogProvider>
    </ThemeProvider>
  );
}
