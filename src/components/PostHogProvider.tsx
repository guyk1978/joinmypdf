"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { ReactNode } from "react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (typeof window !== "undefined" && key) {
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!key) return children;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
