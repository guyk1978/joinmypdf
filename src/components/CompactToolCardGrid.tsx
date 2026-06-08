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
    <div className={clsx("grid grid-cols-2 gap-[3px] md:grid-cols-4 lg:grid-cols-6", isGlass ? "" : "gap-2", className)}>
      {items.map((item) => {
        const visual = getToolIcon(item.slugHint, item.label);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={
              isGlass
                ? "group flex min-h-[80px] flex-col items-center justify-center rounded-[12px] border border-neutral-200 bg-white/60 px-2 py-2 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-[background-color,box-shadow] hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/5 dark:bg-black/20 dark:shadow-none dark:hover:bg-black/30"
                : "group flex min-h-[80px] flex-col items-center justify-center rounded-none border border-dashed border-neutral-400 bg-neutral-200 px-2 py-2 text-center transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
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
