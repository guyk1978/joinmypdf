"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const tHeader = useTranslations("Header");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{tHeader("language")}</span>
      <select
        value={locale}
        aria-label={tHeader("language")}
        className="rounded-none border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-black transition hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600"
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          if (!routing.locales.includes(nextLocale) || nextLocale === locale) return;
          router.replace(pathname, { locale: nextLocale });
        }}
      >
        {routing.locales.map((item) => (
          <option key={item} value={item}>
            {t(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
