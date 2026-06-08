"use client";

import { Check, Share2 } from "lucide-react";
import { clsx } from "clsx";
import { usePageShare } from "@/hooks/usePageShare";

export function HeaderShareButton() {
  const { handleShare, copied, busy, ariaLabel, title } = usePageShare();

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={busy}
      className={clsx(
        "inline-flex h-full shrink-0 items-center justify-center rounded-none px-3 transition-colors duration-500 ease-in-out hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-950",
        copied && "bg-neutral-200 dark:bg-neutral-800",
      )}
      aria-label={ariaLabel}
      title={title}
    >
      {copied ? (
        <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : (
        <Share2 className="h-5 w-5 text-black dark:text-neutral-200" aria-hidden="true" />
      )}
    </button>
  );
}
