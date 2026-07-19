"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { readTopUsedToolIds } from "@/lib/recent-activity";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/** Shown until the visitor has personal usage history. */
const FALLBACK_QUICK_ACTION_IDS = [
  "pdf-merge",
  "pdf-compress",
  "image-combiner",
  "video-trimmer",
];

const QUICK_ACTION_COUNT = 4;

type QuickActionsProps = {
  locale: string;
};

/**
 * Horizontal strip of matte-glass pill shortcuts under the hero text.
 * Ranks the visitor's 4 most-used tools from localStorage usage counts
 * (recorded by ToolPageShellProvider) and falls back to sitewide staples.
 */
export function QuickActions({ locale }: QuickActionsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  // Fallbacks render on the server and first client paint (hydration-safe);
  // the personalized ranking swaps in after mount.
  const [toolIds, setToolIds] = useState<string[]>(FALLBACK_QUICK_ACTION_IDS);

  useEffect(() => {
    const personal = readTopUsedToolIds(QUICK_ACTION_COUNT * 2).filter((id) =>
      getToolsInventoryEntry(id),
    );
    if (!personal.length) return;
    const merged = [...personal];
    for (const id of FALLBACK_QUICK_ACTION_IDS) {
      if (merged.length >= QUICK_ACTION_COUNT) break;
      if (!merged.includes(id)) merged.push(id);
    }
    setToolIds(merged.slice(0, QUICK_ACTION_COUNT));
  }, []);

  const actions = useMemo(() => {
    return toolIds.map((id) => {
      const entry = getToolsInventoryEntry(id);
      return {
        id,
        href: resolveToolHref(id, entry?.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        Icon: getToolListLucideIcon(id),
      };
    });
  }, [toolIds, locale, tTools]);

  return (
    <nav aria-label={t("landing.quickActionsLabel")} className="w-full">
      <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
        {actions.map(({ id, href, title, Icon }) => (
          <li key={id} className="m-0">
            <Link
              href={href}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-sm transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              <Icon size={14} strokeWidth={1.75} aria-hidden />
              <span>{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
