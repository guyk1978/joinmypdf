"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-800/60"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
      )}
    </button>
  );
}
