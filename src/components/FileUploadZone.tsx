"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { matteDropzone, matteDropzoneActive, matteWorkspaceBanner } from "@/lib/tool-ui";

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
        "relative mb-2 border border-dashed border-neutral-400 bg-neutral-300 p-2 text-neutral-800 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200",
        active && "border-neutral-500 text-neutral-800 dark:border-neutral-500 dark:text-neutral-100",
        className,
      )}
      aria-hidden
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H14.5L20.5 8.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V4.25C5.25 3.2835 6.0335 2.5 7 2.5Z" opacity="0.85" />
        <path d="M14.5 2.5V7.5C14.5 8.05228 14.9477 8.5 15.5 8.5H20.5" opacity="0.65" />
        <path d="M7.25 14.5H20.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V14.5H7.25Z" opacity="0.95" />
      </svg>
      <div className="absolute -end-1 -top-1 h-2 w-2 bg-neutral-500 dark:bg-neutral-400" />
    </div>
  );
}

function SelectFilesCta({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-none border border-neutral-400 bg-neutral-200 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-200 dark:text-neutral-950 dark:hover:bg-white"
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
        matteWorkspaceBanner,
        "inline-flex w-full items-start gap-2 text-start sm:items-center",
        className,
      )}
      role="note"
    >
      <ShieldLockIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700 dark:text-neutral-300 sm:mt-0" />
      <p className="text-xs font-medium leading-snug sm:text-sm">
        <span className="font-semibold">{common("privacyTitle")}</span> {common("privacyBody")}
      </p>
    </div>
  );
}

export type FileUploadZoneProps = HTMLAttributes<HTMLDivElement> & {
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
  return "border-neutral-300 bg-white text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
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
        matteDropzone,
        "group relative flex w-full flex-col text-center",
        isHero ? "min-h-[200px] px-2 md:min-h-[220px] md:px-3" : "min-h-[160px] px-2 md:min-h-[180px] md:px-3",
        active ? matteDropzoneActive : "group-hover:border-neutral-400 dark:group-hover:border-neutral-600",
        className,
      )}
      {...rest}
    >
      {input}
      <div
        className={clsx(
          "flex w-full flex-1 flex-col items-center justify-center",
          isHero ? "gap-2 py-4 md:py-3" : "gap-1.5 py-3 md:py-4",
        )}
      >
        <PrivacyUploadBadge className="w-full shrink-0" />
        <UploadArrowIcon active={active} />
        <div className="max-w-md space-y-1">
          <p className="text-base font-bold tracking-tight text-black dark:text-neutral-200 md:text-lg">{title}</p>
          {description ? (
            <p className="text-sm leading-relaxed text-black dark:text-neutral-200 md:text-base">{description}</p>
          ) : null}
        </div>
        <SelectFilesCta label={common("selectFiles")} ariaLabel={common("selectFilesAria")} />
        {supportedFormats.length ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-1.5 pt-1">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className={clsx(
                  "inline-flex items-center rounded-none border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
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
