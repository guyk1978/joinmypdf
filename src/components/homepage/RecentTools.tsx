"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { useRecentTools } from "@/hooks/useRecentTools";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

type RecentToolsProps = {
  locale: string;
};

/**
 * "Your Recent Tools" — last 3 tools visited, as matte pill cards under
 * the Quick Actions strip. Hidden entirely for first-time visitors.
 */
export function RecentTools({ locale }: RecentToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const { recentToolIds, hydrated } = useRecentTools(3);

  const cards = useMemo(() => {
    const resolved = [];
    for (const id of recentToolIds) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      resolved.push({
        id,
        href: resolveToolHref(id, entry.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        Icon: getToolListLucideIcon(id),
      });
    }
    return resolved;
  }, [recentToolIds, locale, tTools]);

  // Wait for hydration so first-time users never flash an empty heading,
  // and so SSR + first client paint stay identical (empty → null).
  if (!hydrated || !cards.length) return null;

  return (
    <HomeReveal className="w-full">
      <section aria-labelledby="recent-tools-title" className="w-full">
        <h2
          id="recent-tools-title"
          className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-300"
        >
          <History size={15} strokeWidth={1.75} aria-hidden className="text-neutral-500" />
          {t("landing.recentToolsTitle")}
        </h2>

        <ul className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0">
          {cards.map(({ id, href, title, Icon }) => (
            <li key={id} className="m-0">
              <Link
                href={href}
                prefetch={false}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-neutral-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
              >
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/75 transition-colors duration-200 group-hover:border-white/20 group-hover:text-white"
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span>{title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </HomeReveal>
  );
}
