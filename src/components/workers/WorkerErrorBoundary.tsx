"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { resetFfmpegEngine } from "@/components/tools/ffmpeg/ffmpeg-environment";
import { FFMPEG_WORKER_SCRIPT_PATH } from "@/services/media/workers/FfmpegWorkerClient";
import { toolOutlineBtn } from "@/lib/tool-ui";

type WorkerErrorBoundaryProps = {
  children: ReactNode;
  className?: string;
  /** Absolute worker script path used for messaging / recovery hints. */
  workerPath?: string;
  /** Called after the user dismisses or retries. */
  onReset?: () => void;
};

type WorkerErrorBoundaryState = {
  error: Error | null;
};

function isWorkerRelatedError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("worker") ||
    message.includes("ffmpeg") ||
    message.includes("content security policy") ||
    message.includes("csp") ||
    message.includes("failed to construct") ||
    message.includes("importscripts") ||
    message.includes("sharedarraybuffer")
  );
}

function errorFromUnknown(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string" && value.trim()) return new Error(value);
  return new Error(String(value || "Media worker failed to load."));
}

function userFacingMessage(error: Error, workerPath: string): string {
  const lower = error.message.toLowerCase();

  if (lower.includes("content security policy") || lower.includes("csp") || lower.includes("violates")) {
    return `The FFmpeg worker at ${workerPath} was blocked by Content Security Policy. Ensure worker-src allows 'self' and blob:, then reload.`;
  }

  if (lower.includes("failed to construct") || lower.includes("cannot be accessed from origin")) {
    return `Could not start the media worker (${workerPath}). Hard-refresh so the same-origin worker script loads, then try again.`;
  }

  if (isWorkerRelatedError(error)) {
    return error.message.trim() || `Media worker failed to load (${workerPath}).`;
  }

  return error.message.trim() || "Something went wrong while loading a background worker.";
}

/**
 * Catches FFmpeg / Worker load failures that would otherwise surface as
 * unhandled console errors, and shows a recoverable in-page notice instead.
 */
export class WorkerErrorBoundary extends Component<
  WorkerErrorBoundaryProps,
  WorkerErrorBoundaryState
> {
  state: WorkerErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WorkerErrorBoundaryState {
    return { error };
  }

  componentDidMount(): void {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount(): void {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep a single structured log; avoid rethrowing so the UI stays usable.
    console.warn("[WorkerErrorBoundary]", error.message, info.componentStack);
  }

  private handleWindowError = (event: ErrorEvent): void => {
    if (this.state.error) return;
    const error = event.error instanceof Error ? event.error : new Error(event.message || "Worker error");
    if (!isWorkerRelatedError(error)) return;
    event.preventDefault();
    this.setState({ error });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    if (this.state.error) return;
    const error = errorFromUnknown(event.reason);
    if (!isWorkerRelatedError(error)) return;
    event.preventDefault();
    this.setState({ error });
  };

  private handleRetry = (): void => {
    resetFfmpegEngine();
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { children, className, workerPath = FFMPEG_WORKER_SCRIPT_PATH } = this.props;
    const { error } = this.state;

    if (!error) {
      return children;
    }

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
          <div className="space-y-1">
            <p className="font-medium text-red-200">Media worker failed to load</p>
            <p>{userFacingMessage(error, workerPath)}</p>
          </div>
        </div>
        <button type="button" className={toolOutlineBtn} onClick={this.handleRetry}>
          <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />
          Reload media engine
        </button>
      </div>
    );
  }
}
