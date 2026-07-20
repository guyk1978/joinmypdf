"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { homeToolAccentStyle } from "@/components/homepage/home-accent";
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
            style={homeToolAccentStyle(id)}
            className="home-accent-card group flex flex-col gap-4 rounded-2xl p-6 hover:-translate-y-0.5"
          >
            <span
              aria-hidden
              className="home-accent-card__icon inline-flex h-12 w-12 items-center justify-center rounded-xl"
            >
              <Icon size={24} strokeWidth={1.75} />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="home-accent-card__title text-base font-semibold leading-snug">
                {title}
              </span>
              {description ? (
                <span className="home-accent-card__desc text-sm leading-relaxed">
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
