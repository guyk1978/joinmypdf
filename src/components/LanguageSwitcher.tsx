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
        className="rounded-none border border-neutral-300 dark:border-neutral-800/80 bg-white/90 px-2 py-1.5 text-xs font-medium text-black dark:text-neutral-300 backdrop-blur-sm transition hover:border-neutral-300 dark:border-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:ring-neutral-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:border-neutral-300 dark:border-neutral-800"
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
