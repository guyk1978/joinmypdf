"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";

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
    <div
      className={clsx(
        "relative mb-3 border border-neutral-800 bg-neutral-900 p-3 transition-colors dark:border-neutral-800 dark:bg-neutral-900",
        active && "border-neutral-600",
        className,
      )}
      aria-hidden
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H14.5L20.5 8.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V4.25C5.25 3.2835 6.0335 2.5 7 2.5Z" fill={active ? "#525252" : "#737373"} />
        <path d="M14.5 2.5V7.5C14.5 8.05228 14.9477 8.5 15.5 8.5H20.5" fill={active ? "#737373" : "#a3a3a3"} />
        <path d="M7.25 14.5H20.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V14.5H7.25Z" fill={active ? "#404040" : "#525252"} />
        <path d="M8.5 17.5V15.7H10.2C10.95 15.7 11.55 16.25 11.55 17C11.55 17.75 10.95 18.3 10.2 18.3H9.35V19.3H8.5V17.5Z" fill="white" />
        <path d="M12.5 19.3V15.7H13.95C15.05 15.7 15.85 16.45 15.85 17.5C15.85 18.55 15.05 19.3 13.95 19.3H12.5Z" fill="white" />
        <path d="M16.8 19.3V15.7H19.45V16.5H17.65V17.1H19.15V17.9H17.65V19.3H16.8Z" fill="white" />
      </svg>
      <div className="absolute -end-1 -top-1 h-2.5 w-2.5 bg-neutral-400 dark:bg-neutral-500" />
    </div>
  );
}

function SelectFilesCta({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center border border-neutral-600 bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 dark:bg-neutral-200 dark:text-neutral-950"
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}

export function PrivacyUploadBadge({ className }: { className?: string }) {
  const common = useTranslations("Workspace.common");

  return (
    <div
      className={clsx(
        "inline-flex w-full max-w-2xl items-start gap-2.5 border border-neutral-800 bg-neutral-900 px-3 py-2 text-start sm:items-center sm:px-3 sm:py-2 dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      role="note"
    >
      <ShieldLockIcon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400 sm:mt-0" />
      <p className="text-xs font-medium leading-snug text-neutral-300 sm:text-sm">
        <span className="font-semibold text-neutral-200">{common("privacyTitle")}</span>{" "}
        {common("privacyBody")}
      </p>
    </div>
  );
}

export type FileUploadZoneProps = HTMLAttributes<HTMLDivElement> & {
  /** Tool operation id — auto-fills title/description from Workspace.upload when omitted. */
  operation?: string;
  drag?: boolean;
  title?: string;
  description?: string;
  input?: ReactNode;
  footer?: ReactNode;
  iconActive?: boolean;
  supportedFormats?: string[];
  variant?: "default" | "hero";
};

function formatBadgeClass(_format: string) {
  return "border-neutral-300 bg-neutral-100 text-black dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
}

export function FileUploadZone({
  operation,
  drag = false,
  title: titleProp,
  description: descriptionProp,
  input,
  footer,
  iconActive,
  supportedFormats = ["PDF"],
  variant = "default",
  className,
  children,
  ...rest
}: FileUploadZoneProps) {
  const ws = useWorkspaceI18n(operation ?? "");
  const common = useTranslations("Workspace.common");
  const active = drag || iconActive;
  const isHero = variant === "hero";

  const title = titleProp ?? (operation ? ws.uploadTitle() : "");
  const description = descriptionProp ?? (operation ? ws.uploadDescription() : undefined);

  return (
    <div
      className={clsx(
        "group relative mx-auto flex w-full max-w-3xl flex-col border border-dashed border-neutral-800 bg-neutral-900 text-center transition-colors dark:border-neutral-800 dark:bg-neutral-900",
        isHero
          ? "min-h-[240px] px-4 md:min-h-[280px] md:px-4"
          : "min-h-[200px] px-4 md:min-h-[220px] md:px-4",
        active
          ? "border-neutral-600 bg-neutral-900 dark:border-neutral-600 dark:bg-neutral-900"
          : "border-neutral-800 group-hover:border-neutral-600 dark:border-neutral-800 dark:group-hover:border-neutral-600",
        className,
      )}
      {...rest}
    >
      {input}
      <div
        className={clsx(
          "flex w-full flex-1 flex-col items-center justify-center",
          isHero ? "gap-4 px-1 py-5 md:gap-5 md:py-3" : "gap-4 px-1 py-4 md:gap-4 md:py-5",
        )}
      >
        <PrivacyUploadBadge className="max-w-xl shrink-0 sm:max-w-2xl" />
        <UploadArrowIcon active={active} />
        <div className="max-w-md space-y-2">
          <p className="text-lg font-bold tracking-tight text-neutral-200 md:text-xl">{title}</p>
          {description ? (
            <p className="text-sm leading-relaxed text-neutral-400 md:text-base">{description}</p>
          ) : null}
        </div>
        <SelectFilesCta label={common("selectFiles")} ariaLabel={common("selectFilesAria")} />
        {supportedFormats.length ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-2 pt-1">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className={clsx(
                  "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  formatBadgeClass(format),
                )}
              >
                {format}
              </span>
            ))}
          </div>
        ) : null}
        {footer ? <div className="w-full shrink-0 pt-1">{footer}</div> : null}
        {children}
      </div>
    </div>
  );
}
