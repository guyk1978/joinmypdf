import { ToolListIcon } from "@/components/ToolListIcon";

type Props = {
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function ToolPageHero({ slug, title, subtitle, eyebrow = "JoinMyPDF" }: Props) {
  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>
      <div className="group flex items-center gap-3 sm:gap-4">
        <ToolListIcon slug={slug} label={title} size="md" className="!size-10 sm:!size-10" />
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
