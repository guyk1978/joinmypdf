"use client";

import { AlertTriangle, Info } from "lucide-react";
import { clsx } from "clsx";
import type { FfmpegEnvironmentStatus } from "@/components/tools/ffmpeg/ffmpeg-environment";

type FfmpegEnvironmentNoticeProps = {
  environment: FfmpegEnvironmentStatus | null;
  error?: string;
  className?: string;
};

export function FfmpegEnvironmentNotice({ environment, error, className }: FfmpegEnvironmentNoticeProps) {
  if (error) {
    return (
      <div
        className={clsx(
          "rounded-none border border-red-900/60 bg-[#1a1a1a] p-4 text-sm text-red-300",
          className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!environment?.performanceNotice) return null;

  return (
    <div
      className={clsx(
        "rounded-none border border-neutral-700 bg-[#1a1a1a] p-3 text-xs leading-relaxed text-neutral-400",
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
        <p>{environment.performanceNotice}</p>
      </div>
    </div>
  );
}
