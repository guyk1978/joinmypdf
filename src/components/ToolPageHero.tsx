import { clsx } from "clsx";
import { Crop, Scissors } from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";

const HERO_ICON_WRAP: Record<string, string> = {
  "crop-pdf":
    "bg-red-50 ring-1 ring-red-100 dark:bg-red-950/30 dark:ring-red-900/50",
  "pdf-merge": "bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:ring-indigo-900/50",
  "pdf-compress": "bg-orange-50 ring-1 ring-orange-100 dark:bg-orange-950/30 dark:ring-orange-900/50",
  "pdf-split": "bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-950/30 dark:ring-violet-900/50",
  "redact-pdf": "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700",
  "sign-pdf": "bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:ring-indigo-900/50",
  "add-watermark": "bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:ring-sky-900/50",
  "rotate-pdf": "bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-900/50",
};

const DEFAULT_HERO_WRAP =
  "bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:ring-indigo-900/50";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
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

export function ToolPageHero({ slug, title, subtitle }: Props) {
  const wrap = HERO_ICON_WRAP[slug] ?? DEFAULT_HERO_WRAP;

  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
        JoinMyPDF
      </p>
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          className={clsx(
            "mr-0 inline-flex shrink-0 items-center justify-center rounded-2xl p-2.5 shadow-sm sm:mr-1",
            wrap,
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
