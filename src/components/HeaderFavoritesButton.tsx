"use client";

import { Star } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function HeaderFavoritesButton() {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = pathname.includes("/favorites");

  return (
    <Link
      href="/favorites/"
      className={clsx(
        "inline-flex h-full shrink-0 items-center justify-center rounded-none px-3 transition-colors duration-500 ease-in-out hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-950",
        active && "bg-neutral-200 dark:bg-neutral-800",
      )}
      aria-label={t("favorites")}
      title={t("favorites")}
      prefetch={false}
    >
      <Star
        className={clsx(
          "h-5 w-5 text-black dark:text-neutral-200",
          active && "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}
