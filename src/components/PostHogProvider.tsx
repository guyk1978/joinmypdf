"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { PostHog } from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

type PHProviderProps = { client: PostHog; children: ReactNode };

/**
 * Lazy-loads PostHog after idle so analytics does not inflate TBT on first paint.
 * UI is unchanged; capture starts once the client is ready.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<{
    Provider: ComponentType<PHProviderProps>;
    client: PostHog;
  } | null>(null);

  useEffect(() => {
    if (!key) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      void Promise.all([import("posthog-js"), import("posthog-js/react")]).then(
        ([phMod, reactMod]) => {
          if (cancelled) return;
          const posthog = phMod.default;
          posthog.init(key, {
            api_host: host,
            capture_pageview: true,
            persistence: "localStorage+cookie",
          });
          setBundle({
            Provider: reactMod.PostHogProvider as ComponentType<PHProviderProps>,
            client: posthog,
          });
        },
      );
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 3500 });
    } else {
      timeoutId = setTimeout(start, 2000);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  if (!key || !bundle) return children;
  const { Provider, client } = bundle;
  return <Provider client={client}>{children}</Provider>;
}
