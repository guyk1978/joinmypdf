import { Link } from "@/i18n/navigation";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

export function CompactToolCardGrid({ items }: { items: CompactToolCardItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => {
        const visual = getToolIcon(item.slugHint, item.label);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group flex min-h-[80px] flex-col items-center justify-center rounded-none border border-neutral-300 bg-neutral-200 px-2 py-2 text-center transition-colors hover:border-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
          >
            <span
              className={`${TOOL_ICON_WRAP_CLASS} inline-flex h-9 w-9 items-center justify-center rounded-none transition-colors ${visual.wrap} ${visual.wrapHover}`}
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
  );
}
