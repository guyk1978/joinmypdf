"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import type { ToolMegaGridGroupId } from "@/lib/mega-menu";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";
import { isNavItemActive } from "@/lib/nav-config";

export type ToolMegaGridItem = {
  href: string;
  label: string;
  slugHint?: string;
};

export type ToolMegaGridGroup = {
  id: ToolMegaGridGroupId;
  label: string;
  items: ToolMegaGridItem[];
};

type ToolMegaGridProps = {
  groups: ToolMegaGridGroup[];
  onNavigate?: () => void;
  className?: string;
};

function ToolMegaGridCells({
  items,
  onNavigate,
}: {
  items: ToolMegaGridItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "/";

  return (
    <>
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
              "group flex min-h-[68px] w-full flex-col items-center justify-center rounded-none border border-neutral-200/70 bg-white/70 px-1.5 py-2 text-center transition-colors hover:bg-neutral-100 dark:border-white/5 dark:bg-neutral-950/30 dark:hover:bg-neutral-800",
              active && "bg-neutral-100 dark:bg-neutral-800",
            )}
          >
            <span
              className={clsx(
                TOOL_ICON_WRAP_CLASS,
                "inline-flex h-8 w-8 items-center justify-center rounded-none transition-colors",
                visual.wrap,
                visual.wrapHover,
              )}
              aria-hidden="true"
            >
              {visual.icon}
            </span>
            <span className="mt-1 line-clamp-2 text-[0.6875rem] font-semibold leading-tight text-neutral-900 dark:text-neutral-200">
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function ToolMegaGrid({ groups, onNavigate, className }: ToolMegaGridProps) {
  return (
    <div className={clsx("w-full bg-transparent px-3 py-3 md:px-4", className)}>
      <div className="flex w-full flex-col gap-[3px]">
        {groups.map((group, index) => (
          <section
            key={group.id}
            aria-labelledby={`tool-mega-group-${group.id}`}
            className={clsx(
              "flex flex-col gap-[3px] pb-3",
              index < groups.length - 1 && "border-b border-neutral-200/80 dark:border-white/5",
            )}
          >
            <h3
              id={`tool-mega-group-${group.id}`}
              className="px-0.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500"
            >
              {group.label}
            </h3>
            <div className="home-tool-grid">
              <ToolMegaGridCells items={group.items} onNavigate={onNavigate} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
