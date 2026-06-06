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
        className="inline-flex h-full w-10 shrink-0 items-center justify-center rounded-none"
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
      className="inline-flex h-full shrink-0 items-center justify-center rounded-none px-3 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-950"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-black dark:text-neutral-200" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-black" aria-hidden="true" />
      )}
    </button>
  );
}
