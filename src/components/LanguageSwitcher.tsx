"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { routing, type AppLocale } from "@/i18n/routing";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("shrink-0 opacity-70 transition-transform", open && "rotate-180")}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const tHeader = useTranslations("Header");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const selectLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (!routing.locales.includes(nextLocale) || nextLocale === locale) {
        close();
        return;
      }
      router.replace(pathname, { locale: nextLocale });
      close();
    },
    [close, locale, pathname, router],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative flex h-full items-stretch">
      <button
        type="button"
        className="inline-flex h-full items-center gap-1.5 px-3 text-xs font-medium text-black transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-600"
        aria-label={tHeader("language")}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{t(locale)}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={tHeader("language")}
          className="absolute end-0 top-full z-[60] min-w-[9rem] border border-neutral-300 bg-white py-1 shadow-none dark:border-neutral-700 dark:bg-neutral-900"
        >
          {routing.locales.map((item) => {
            const selected = item === locale;
            return (
              <li key={item} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={clsx(
                    "flex w-full items-center px-3 py-2 text-start text-xs transition-colors",
                    selected
                      ? "bg-neutral-100 text-black dark:bg-neutral-800 dark:text-neutral-200"
                      : "text-black hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  )}
                  onClick={() => selectLocale(item)}
                >
                  {t(item)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
