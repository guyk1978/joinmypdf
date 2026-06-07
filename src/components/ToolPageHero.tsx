import { clsx } from "clsx";
import { Crop, Scissors } from "lucide-react";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

type Props = {
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

function HeroIconGraphic({ slug }: { slug: string }) {
  if (slug === "crop-pdf") {
    return <Crop className="h-10 w-10 text-ink dark:text-white" strokeWidth={2.25} aria-hidden />;
  }
  if (slug === "pdf-split") {
    return <Scissors className="h-10 w-10 text-ink dark:text-white" strokeWidth={2.25} aria-hidden />;
  }

  const visual = getToolIcon(slug);
  return <span className="[&_svg]:h-10 [&_svg]:w-10">{visual.icon}</span>;
}

export function ToolPageHero({ slug, title, subtitle, eyebrow = "JoinMyPDF" }: Props) {
  const visual = getToolIcon(slug);

  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={clsx(
            TOOL_ICON_WRAP_CLASS,
            "tool-icon-wrap inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-md ring-1 ring-white/10",
            visual.wrap,
          )}
          aria-hidden
        >
          <HeroIconGraphic slug={slug} />
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
