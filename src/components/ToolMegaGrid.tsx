"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";
import { isNavItemActive } from "@/lib/nav-config";

export type ToolMegaGridItem = {
  href: string;
  label: string;
  slugHint?: string;
};

type ToolMegaGridProps = {
  items: ToolMegaGridItem[];
  onNavigate?: () => void;
  className?: string;
};

export function ToolMegaGrid({ items, onNavigate, className }: ToolMegaGridProps) {
  const pathname = usePathname() || "/";

  return (
    <div className={clsx("w-full overflow-y-auto bg-white p-4 dark:bg-neutral-950 md:p-0", className)}>
      <div className="grid w-full grid-cols-2 gap-px bg-neutral-300 dark:bg-neutral-700 md:grid-cols-4 lg:grid-cols-8">
        {items.map((item) => {
          const visual = getToolIcon(item.slugHint, item.label);
          const active = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={clsx(
                "group flex min-h-[76px] w-full flex-col items-center justify-center rounded-none bg-white px-2 py-3 text-center transition-colors hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900 md:min-h-[88px]",
                active && "bg-neutral-100 dark:bg-neutral-900",
              )}
            >
              <span
                className={clsx(
                  TOOL_ICON_WRAP_CLASS,
                  "inline-flex h-9 w-9 items-center justify-center rounded-none transition-colors",
                  visual.wrap,
                  visual.wrapHover,
                )}
                aria-hidden="true"
              >
                {visual.icon}
              </span>
              <span className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight text-black dark:text-neutral-200">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
