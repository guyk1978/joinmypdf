import Link from "next/link";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

function iconVisual(label: string, slugHint?: string) {
  const source = `${label} ${slugHint || ""}`.toLowerCase();
  if (/(word|excel|powerpoint|openoffice|iwork|ebook|office)/.test(source)) {
    return {
      icon: "DOC",
      wrap: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    };
  }
  if (/(compress|split|merge|optimi|rotate|crop|watermark|delete|page|unlock|protect|sign)/.test(source)) {
    return {
      icon: "OPT",
      wrap: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    };
  }
  if (/(html|markdown|cad|autocad|dev|code|data|timeline|invoice)/.test(source)) {
    return {
      icon: "</>",
      wrap: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    };
  }
  return {
    icon: "PDF",
    wrap: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
}

export function CompactToolCardGrid({ items }: { items: CompactToolCardItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => {
        const visual = iconVisual(item.label, item.slugHint);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group flex min-h-[108px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold tracking-wide ${visual.wrap}`}
              aria-hidden="true"
            >
              {visual.icon}
            </span>
            <span className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
