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

const GROUP_THEME: Record<
  ToolMegaGridGroupId,
  {
    container: string;
    heading: string;
  }
> = {
  conversion: {
    container:
      "border border-blue-400/35 bg-blue-500/[0.06] shadow-[0_0_22px_rgba(59,130,246,0.14)] ring-1 ring-blue-400/25 backdrop-blur-md dark:border-blue-400/45 dark:bg-blue-500/10 dark:shadow-[0_0_28px_rgba(59,130,246,0.22)] dark:ring-blue-400/35",
    heading: "text-blue-700 dark:text-blue-300",
  },
  editing: {
    container:
      "border border-emerald-400/35 bg-emerald-500/[0.06] shadow-[0_0_22px_rgba(16,185,129,0.14)] ring-1 ring-emerald-400/25 backdrop-blur-md dark:border-emerald-400/45 dark:bg-emerald-500/10 dark:shadow-[0_0_28px_rgba(16,185,129,0.22)] dark:ring-emerald-400/35",
    heading: "text-emerald-700 dark:text-emerald-300",
  },
  security: {
    container:
      "border border-violet-400/35 bg-violet-500/[0.06] shadow-[0_0_22px_rgba(139,92,246,0.14)] ring-1 ring-violet-400/25 backdrop-blur-md dark:border-violet-400/45 dark:bg-violet-500/10 dark:shadow-[0_0_28px_rgba(139,92,246,0.22)] dark:ring-violet-400/35",
    heading: "text-violet-700 dark:text-violet-300",
  },
  advanced: {
    container:
      "border border-orange-400/35 bg-orange-500/[0.06] shadow-[0_0_22px_rgba(249,115,22,0.14)] ring-1 ring-orange-400/25 backdrop-blur-md dark:border-orange-400/45 dark:bg-orange-500/10 dark:shadow-[0_0_28px_rgba(249,115,22,0.22)] dark:ring-orange-400/35",
    heading: "text-orange-700 dark:text-orange-300",
  },
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
    </>
  );
}

export function ToolMegaGrid({ groups, onNavigate, className }: ToolMegaGridProps) {
  return (
    <div className={clsx("w-full overflow-y-auto bg-white p-4 dark:bg-neutral-950 md:p-4", className)}>
      <div className="flex w-full flex-col gap-4">
        {groups.map((group) => {
          const theme = GROUP_THEME[group.id];

          return (
            <section
              key={group.id}
              aria-labelledby={`tool-mega-group-${group.id}`}
              className={clsx("rounded-none p-3 md:p-4", theme.container)}
            >
              <h3
                id={`tool-mega-group-${group.id}`}
                className={clsx(
                  "mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em]",
                  theme.heading,
                )}
              >
                {group.label}
              </h3>
              <div className="grid w-full grid-cols-2 gap-px bg-neutral-300 dark:bg-neutral-700 md:grid-cols-4 lg:grid-cols-8">
                <ToolMegaGridCells items={group.items} onNavigate={onNavigate} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
