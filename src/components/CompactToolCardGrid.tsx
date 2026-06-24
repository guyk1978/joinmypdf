import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

export function CompactToolCardGrid({
  items,
  className,
  variant = "default",
}: {
  items: CompactToolCardItem[];
  className?: string;
  variant?: "default" | "glass";
}) {
  const isGlass = variant === "glass";

  return (
    <div className={clsx("grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6", !isGlass && "gap-2", className)}>
      {items.map((item) => {
        const visual = getToolIcon(item.slugHint, item.label);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={
              isGlass
                ? "compact-tool-card compact-tool-card--glass group flex min-h-[88px] flex-col items-center justify-center rounded-none px-2 py-3 text-center transition-all duration-300 hover:shadow-[var(--surface-elevate)]"
                : "group flex min-h-[80px] flex-col items-center justify-center rounded-none bg-transparent px-2 py-2 text-center shadow-[var(--surface-separate)] transition-all hover:shadow-[var(--surface-elevate)] dark:bg-transparent"
            }
          >
            <span
              className={`${TOOL_ICON_WRAP_CLASS} inline-flex h-9 w-9 items-center justify-center rounded-none transition-colors ${visual.wrap} ${visual.wrapHover}`}
              aria-hidden="true"
            >
              {visual.icon}
            </span>
            <span className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight text-neutral-900 dark:text-neutral-200">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
