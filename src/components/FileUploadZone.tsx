"use client";

import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

function ShieldLockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 4 7v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V7l-8-4Z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  );
}

function UploadArrowIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect
        x="10"
        y="6"
        width="28"
        height="36"
        rx="3"
        className={active ? "stroke-brand" : "stroke-ink-muted/70"}
        strokeWidth="1.75"
      />
      <path
        d="M18 18h12M18 24h8"
        className={active ? "stroke-brand/70" : "stroke-ink-muted/50"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="34"
        r="9"
        className={active ? "fill-brand/15 stroke-brand" : "fill-white/[0.06] stroke-brand/60"}
        strokeWidth="1.75"
      />
      <path
        d="M24 30v6M21 33l3-3 3 3"
        className={active ? "stroke-brand" : "stroke-brand"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PrivacyUploadBadge({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "inline-flex w-full max-w-2xl items-start gap-2.5 rounded-xl border border-brand/35 bg-brand/10 px-3.5 py-2.5 text-left shadow-[0_0_24px_rgba(56,189,248,0.08)] sm:items-center sm:px-4 sm:py-3",
        className
      )}
      role="note"
    >
      <ShieldLockIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand sm:mt-0" />
      <p className="text-xs font-medium leading-snug text-ink sm:text-sm">
        <span className="text-brand">100% Private &amp; Fast:</span>{" "}
        Files are processed locally in your browser and never leave your device.
      </p>
    </div>
  );
}

export type FileUploadZoneProps = HTMLAttributes<HTMLDivElement> & {
  drag?: boolean;
  title: string;
  description?: string;
  input?: ReactNode;
  footer?: ReactNode;
  iconActive?: boolean;
  /** Hero homepage uses extra vertical rhythm inside the dashed box. */
  variant?: "default" | "hero";
};

export function FileUploadZone({
  drag = false,
  title,
  description,
  input,
  footer,
  iconActive,
  variant = "default",
  className,
  children,
  ...rest
}: FileUploadZoneProps) {
  const active = drag || iconActive;
  const isHero = variant === "hero";

  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-2xl border-2 border-dashed text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors",
        isHero
          ? "min-h-[300px] px-5 md:min-h-[340px] md:px-8"
          : "min-h-[220px] px-6 md:min-h-[260px] md:px-10",
        active
          ? "border-brand bg-brand/10"
          : "border-white/20 bg-gradient-to-b from-white/[0.07] to-white/[0.02]",
        className
      )}
      {...rest}
    >
      {input}
      <div
        className={clsx(
          "flex w-full flex-1 flex-col items-center justify-center",
          isHero
            ? "gap-6 px-1 py-8 md:gap-7 md:px-2 md:py-10"
            : "gap-5 px-1 py-6 md:gap-6 md:py-8"
        )}
      >
        <PrivacyUploadBadge className="max-w-xl shrink-0 sm:max-w-2xl" />
        <UploadArrowIcon
          className={clsx(
            "h-12 w-12 shrink-0 transition-colors md:h-14 md:w-14",
            active ? "text-brand" : "text-ink-muted"
          )}
          active={active}
        />
        <div className="max-w-md space-y-2">
          <p className="text-lg font-semibold tracking-tight text-ink md:text-xl">{title}</p>
          {description ? (
            <p className="text-sm leading-relaxed text-ink-muted md:text-base">{description}</p>
          ) : null}
        </div>
        {footer ? <div className="w-full shrink-0 pt-1">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
