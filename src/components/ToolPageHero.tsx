import { clsx } from "clsx";
import { getToolIcon, TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";

type Props = {
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function ToolPageHero({ slug, title, subtitle, eyebrow = "JoinMyPDF" }: Props) {
  const visual = getToolIcon(slug);

  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={clsx(
            TOOL_ICON_BARE_CLASS,
            "inline-flex shrink-0 items-center justify-center [&_svg]:h-10 [&_svg]:w-10",
          )}
          aria-hidden
        >
          {visual.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white md:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="sr-only">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
