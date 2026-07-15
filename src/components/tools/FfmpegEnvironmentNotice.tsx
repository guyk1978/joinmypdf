"use client";

import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import {
  resetFfmpegEngine,
  type FfmpegEnvironmentStatus,
} from "@/components/tools/ffmpeg/ffmpeg-environment";
import { toolOutlineBtn } from "@/lib/tool-ui";

type FfmpegEnvironmentNoticeProps = {
  environment: FfmpegEnvironmentStatus | null;
  error?: string;
  /** Optional: clear parent error / re-run after engine reset. */
  onRetry?: () => void;
  className?: string;
};

export function FfmpegEnvironmentNotice({
  environment,
  error,
  onRetry,
  className,
}: FfmpegEnvironmentNoticeProps) {
  const [resetHint, setResetHint] = useState("");

  const handleReloadEngine = () => {
    resetFfmpegEngine();
    setResetHint("FFmpeg engine reset. Run your conversion again.");
    onRetry?.();
  };

  if (error) {
    return (
      <div
        className={clsx(
          "space-y-3 rounded-none border border-red-900/60 bg-[#1a1a1a] p-4 text-sm text-red-300",
          className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={toolOutlineBtn} onClick={handleReloadEngine}>
            <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />
            Reload FFmpeg engine
          </button>
          {resetHint ? <p className="text-xs text-neutral-400">{resetHint}</p> : null}
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
