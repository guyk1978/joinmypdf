"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Link } from "@/i18n/navigation";
import { Star } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";

const FAVORITES_KEY = "joinmypdf-tool-favorites";

export type HomeToolGridItem = {
  href: string;
  label: string;
  slugHint: string;
};

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistFavorites(slugs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...slugs]));
}

function HomeToolCard({ item }: { item: HomeToolGridItem }) {
  const t = useTranslations("Home");
  const [favorited, setFavorited] = useState(false);
  const slug = item.slugHint;

  useEffect(() => {
    setFavorited(readFavorites().has(slug));
  }, [slug]);

  const toggleFavorite = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const next = readFavorites();
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      persistFavorites(next);
      setFavorited(next.has(slug));
    },
    [slug],
  );

  const visual = getToolIcon(item.slugHint, item.label);

  return (
    <Link
      href={item.href}
      className="group relative flex min-h-[124px] flex-col items-center justify-center rounded-[20px] border border-white/5 bg-neutral-900/50 p-5 text-center backdrop-blur-md transition-[background-color,box-shadow] hover:bg-neutral-900/60 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <button
        type="button"
        onClick={toggleFavorite}
        className="absolute end-3 top-3 rounded-full p-1 text-neutral-500 transition-colors hover:text-amber-400"
        aria-label={favorited ? t("removeFromFavorites") : t("addToFavorites")}
      >
        <Star className={clsx("h-4 w-4", favorited && "fill-amber-400 text-amber-400")} />
      </button>
      <span
        className={clsx(
          TOOL_ICON_WRAP_CLASS,
          "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          visual.wrap,
          visual.wrapHover,
        )}
        aria-hidden
      >
        {visual.icon}
      </span>
      <span className="mt-3 line-clamp-2 text-xs font-semibold leading-snug tracking-wide text-neutral-200">
        {item.label}
      </span>
    </Link>
  );
}

type HomeToolGridProps = {
  items: HomeToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full max-w-[1400px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:gap-8">
        {items.map((item) => (
          <HomeToolCard key={item.href} item={item} />
        ))}
      </div>

      <Link
        href="/tools/"
        className="mt-12 inline-flex items-center justify-center rounded-full bg-emerald-600/90 px-10 py-3.5 text-sm font-bold tracking-wide text-white shadow-inner transition-[background-color,box-shadow] hover:bg-emerald-600 hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)]"
      >
        {t("allTools")}
      </Link>
    </div>
  );
}
