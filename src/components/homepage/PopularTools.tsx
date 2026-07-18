"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/** Tool ids featured this week — titles/descriptions/icons resolve from the registry. */
const POPULAR_TOOL_IDS = [
  "image-combiner",
  "pdf-compress",
  "text-workspace",
] as const;

type PopularToolsProps = {
  locale: string;
};

/**
 * "Popular Tools of the Week" — 3 prominent registry-driven cards between
 * the hero and the category dashboard on the homepage.
 */
export function PopularTools({ locale }: PopularToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");

  const cards = useMemo(() => {
    return POPULAR_TOOL_IDS.map((id) => {
      const entry = getToolsInventoryEntry(id);
      return {
        id,
        href: resolveToolHref(id, entry?.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        description: getToolCardDescription(id, entry?.description, tTools) ?? "",
        Icon: getToolListLucideIcon(id),
      };
    });
  }, [locale, tTools]);

  return (
    <section aria-labelledby="popular-tools-title" className="w-full mt-8 mb-10">
      <h2
        id="popular-tools-title"
        className="mb-5 text-lg font-semibold tracking-tight text-white"
      >
        {t("landing.popularToolsTitle")}
      </h2>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(({ id, href, title, description, Icon }) => (
          <Link
            key={id}
            href={href}
            prefetch={false}
            className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            <span
              aria-hidden
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/80 transition-colors duration-200 group-hover:border-white/20 group-hover:text-white"
            >
              <Icon size={24} strokeWidth={1.75} />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="text-base font-semibold leading-snug text-white">
                {title}
              </span>
              {description ? (
                <span className="text-sm leading-relaxed text-neutral-400">
                  {description}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
