import { clsx } from "clsx";
import { Crop, Scissors } from "lucide-react";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
};

function HeroIconGraphic({ slug }: { slug: string }) {
  if (slug === "crop-pdf") {
    return <Crop className="h-10 w-10 text-red-600 dark:text-red-400" strokeWidth={2.25} aria-hidden />;
  }
  if (slug === "pdf-split") {
    return <Scissors className="h-10 w-10 text-violet-600 dark:text-violet-400" strokeWidth={2.25} aria-hidden />;
  }

  const visual = getToolIcon(slug);
  return <span className="[&_svg]:h-10 [&_svg]:w-10">{visual.icon}</span>;
}

export function ToolPageHero({ slug, title, subtitle, eyebrow = "JoinMyPDF" }: Props) {
  const visual = getToolIcon(slug);

  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
        {eyebrow}
      </p>
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          className={clsx(
            TOOL_ICON_WRAP_CLASS,
            "me-0 inline-flex shrink-0 items-center justify-center rounded-2xl p-2.5 shadow-sm sm:me-1",
            visual.wrap,
          )}
          aria-hidden
        >
          <HeroIconGraphic slug={slug} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
