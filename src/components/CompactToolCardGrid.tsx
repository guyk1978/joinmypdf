import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { ToolListIcon } from "@/components/ToolListIcon";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

type CompactToolCardGridProps = {
  items: CompactToolCardItem[];
  className?: string;
  /** `flat` = borderless related-tools links; `glass`/`default` keep the shared tool cards. */
  variant?: "default" | "glass" | "flat";
};

function FlatRelatedToolLink({ href, label, slugHint }: CompactToolCardItem) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={clsx(
        "related-tools-flat__item group",
        "flex min-w-0 flex-1 items-center gap-3",
        "rounded-none border-0 bg-transparent p-0 shadow-none",
        "text-slate-300 transition-colors",
        "hover:bg-transparent hover:text-white",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-500",
      )}
    >
      <ToolListIcon
        slug={slugHint ?? href}
        label={label}
        className="related-tools-flat__icon"
      />
      <span className="related-tools-flat__label">{label}</span>
    </Link>
  );
}

export function CompactToolCardGrid({
  items,
  className,
  variant = "default",
}: CompactToolCardGridProps) {
  if (variant === "flat") {
    return (
      <div
        className={clsx(
          "related-tools-flat grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3",
          className,
        )}
      >
        {items.map((item) => (
          <FlatRelatedToolLink
            key={`${item.href}-${item.label}`}
            href={item.href}
            label={item.label}
            slugHint={item.slugHint ?? item.href}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("home-feature-grid", className)}>
      {items.map((item) => (
        <HomeFeaturedToolCard
          key={`${item.href}-${item.label}`}
          href={item.href}
          label={item.label}
          slugHint={item.slugHint ?? item.href}
        />
      ))}
    </div>
  );
}
