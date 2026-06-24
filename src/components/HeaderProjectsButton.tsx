"use client";

import { FolderKanban } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function HeaderProjectsButton() {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const active = pathname.includes("/projects");

  return (
    <Link
      href="/projects/"
      className={clsx(
        "inline-flex h-full shrink-0 items-center justify-center rounded-none px-3 transition-colors duration-500 ease-in-out hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:hover:bg-neutral-800 dark:focus-visible:ring-offset-neutral-950",
        active && "bg-neutral-200 dark:bg-neutral-800",
      )}
      aria-label={t("projects")}
      title={t("projects")}
      prefetch={false}
    >
      <FolderKanban
        className={clsx(
          "h-5 w-5 text-black dark:text-neutral-200",
          active && "text-neutral-500 dark:text-neutral-400",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}
