"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { toolOutlineBtn } from "@/lib/tool-ui";

type PdfPreviewErrorBoundaryProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  retryLabel?: string;
  onReset?: () => void;
};

type PdfPreviewErrorBoundaryState = {
  error: Error | null;
};

/**
 * Catches render-time failures in PDF preview trees so a blank canvas
 * does not freeze the whole tool pane.
 */
export class PdfPreviewErrorBoundary extends Component<
  PdfPreviewErrorBoundaryProps,
  PdfPreviewErrorBoundaryState
> {
  state: PdfPreviewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PdfPreviewErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("[PdfPreviewErrorBoundary]", error.message, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const title = this.props.title ?? "PDF preview failed";
    const description =
      this.props.description ??
      (error.message.trim() ||
        "Something went wrong while rendering this PDF. Try another file or re-upload.");
    const retryLabel = this.props.retryLabel ?? "Try again";

    return (
      <div
        className={clsx(
          "flex flex-col items-start gap-3 rounded-none border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-ink",
          this.props.className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-ink-muted">{description}</p>
          </div>
        </div>
        <button type="button" className={toolOutlineBtn} onClick={this.reset}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {retryLabel}
        </button>
      </div>
    );
  }
}
