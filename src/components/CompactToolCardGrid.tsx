import Link from "next/link";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

export function CompactToolCardGrid({ items }: { items: CompactToolCardItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => {
        const visual = getToolIcon(item.slugHint, item.label);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group flex min-h-[124px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-3 py-3.5 text-center shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-md dark:hover:shadow-black/20"
          >
            <span
              className={`${TOOL_ICON_WRAP_CLASS} inline-flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all duration-300 ease-out ${visual.wrap} ${visual.wrapHover}`}
              aria-hidden="true"
            >
              {visual.icon}
            </span>
            <span className="mt-2.5 line-clamp-2 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
