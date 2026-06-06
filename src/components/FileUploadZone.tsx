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
        "relative mb-4 rounded-2xl bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4 shadow-sm ring-1 ring-rose-100 transition-transform duration-300 group-hover:scale-110 dark:from-rose-950/50 dark:via-orange-950/40 dark:to-amber-950/40 dark:ring-rose-900/40",
        className,
      )}
      aria-hidden
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H14.5L20.5 8.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V4.25C5.25 3.2835 6.0335 2.5 7 2.5Z" fill={active ? "#DC2626" : "#EF4444"} />
        <path d="M14.5 2.5V7.5C14.5 8.05228 14.9477 8.5 15.5 8.5H20.5" fill={active ? "#FB7185" : "#F97316"} />
        <path d="M7.25 14.5H20.5V19.25C20.5 20.2165 19.7165 21 18.75 21H7C6.0335 21 5.25 20.2165 5.25 19.25V14.5H7.25Z" fill={active ? "#BE123C" : "#EA580C"} />
        <path d="M8.5 17.5V15.7H10.2C10.95 15.7 11.55 16.25 11.55 17C11.55 17.75 10.95 18.3 10.2 18.3H9.35V19.3H8.5V17.5Z" fill="white" />
        <path d="M12.5 19.3V15.7H13.95C15.05 15.7 15.85 16.45 15.85 17.5C15.85 18.55 15.05 19.3 13.95 19.3H12.5Z" fill="white" />
        <path d="M16.8 19.3V15.7H19.45V16.5H17.65V17.1H19.15V17.9H17.65V19.3H16.8Z" fill="white" />
      </svg>
      <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-500" />
    </div>
  );
}

function SelectFilesCta({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:shadow-indigo-950/50 dark:focus-visible:ring-offset-slate-900"
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
        "inline-flex w-full max-w-2xl items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/80 px-3.5 py-2.5 text-left shadow-sm sm:items-center sm:px-4 sm:py-3 dark:border-brand/35 dark:bg-brand/10 dark:shadow-[0_0_24px_rgba(56,189,248,0.08)]",
        className,
      )}
      role="note"
    >
      <ShieldLockIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 sm:mt-0 dark:text-brand" />
      <p className="text-xs font-medium leading-snug text-blue-900 sm:text-sm dark:text-blue-200">
        <span className="font-semibold text-blue-950 dark:text-blue-100">{common("privacyTitle")}</span>{" "}
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

function formatBadgeClass(format: string) {
  const value = format.toUpperCase();
  if (value.includes("PDF")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200";
  }
  if (value.includes("WORD") || value.includes("DOC")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200";
  }
  if (value.includes("EXCEL") || value.includes("XLS")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200";
  }
  if (value.includes("POWERPOINT") || value.includes("PPT")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200";
  }
  if (value.includes("PNG") || value.includes("JPG") || value.includes("JPEG") || value.includes("IMAGE")) {
    return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-200";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200";
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
        "group relative mx-auto flex w-full max-w-3xl flex-col rounded-2xl border-2 border-dashed text-center transition-all duration-300",
        isHero
          ? "min-h-[300px] px-5 md:min-h-[340px] md:px-8"
          : "min-h-[220px] px-6 md:min-h-[260px] md:px-10",
        active
          ? "border-blue-300 bg-white shadow-lg shadow-blue-100/60 dark:border-blue-500 dark:bg-slate-900/60 dark:shadow-blue-950/30"
          : "border-slate-200 bg-white shadow-md shadow-slate-100/70 group-hover:border-blue-300 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-100/60 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20 dark:group-hover:border-blue-500 dark:group-hover:bg-slate-900/70 dark:group-hover:shadow-blue-950/25",
        className,
      )}
      {...rest}
    >
      {input}
      <div
        className={clsx(
          "flex w-full flex-1 flex-col items-center justify-center",
          isHero ? "gap-6 px-1 py-8 md:gap-7 md:py-10" : "gap-5 px-1 py-6 md:gap-6 md:py-8",
        )}
      >
        <PrivacyUploadBadge className="max-w-xl shrink-0 sm:max-w-2xl" />
        <UploadArrowIcon active={active} />
        <div className="max-w-md space-y-2">
          <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-xl">{title}</p>
          {description ? (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">{description}</p>
          ) : null}
        </div>
        <SelectFilesCta label={common("selectFiles")} ariaLabel={common("selectFilesAria")} />
        {supportedFormats.length ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-2 pt-1">
            {supportedFormats.map((format) => (
              <span
                key={format}
                className={clsx(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
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
