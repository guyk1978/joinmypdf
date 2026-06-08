"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full max-w-[1400px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:gap-8">
        {items.map((item) => (
          <ToolGridCard key={item.href} item={item} />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/favorites/"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-neutral-900/50 px-8 py-3.5 text-sm font-bold tracking-wide text-neutral-200 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-neutral-900/70"
        >
          {t("viewFavorites")}
        </Link>
        <Link
          href="/tools/"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600/90 px-10 py-3.5 text-sm font-bold tracking-wide text-white shadow-inner transition-[background-color,box-shadow] hover:bg-emerald-600 hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)]"
        >
          {t("allTools")}
        </Link>
      </div>
    </div>
  );
}
