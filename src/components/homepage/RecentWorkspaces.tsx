"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileClock, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { homeToolAccentStyle } from "@/components/homepage/home-accent";
import {
  RECENT_ACTIVITY_CHANGED_EVENT,
  readRecentWorkspaces,
  type RecentWorkspaceEntry,
} from "@/lib/recent-activity";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolListLucideIcon } from "@/lib/tool-list-icons";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

const MAX_ITEMS = 3;

type RecentWorkspacesProps = {
  locale: string;
};

function formatRelativeTime(at: number, locale: string): string {
  const diffMs = at - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

/**
 * "Recent Workspaces" — the last files the visitor loaded into a tool
 * (tracked locally by ToolPageShellProvider). Hidden entirely until there
 * is history. Aligns to the Popular Tools 3-card grid.
 */
export function RecentWorkspaces({ locale }: RecentWorkspacesProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const [entries, setEntries] = useState<RecentWorkspaceEntry[]>([]);

  useEffect(() => {
    const sync = () => setEntries(readRecentWorkspaces());
    sync();
    window.addEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = useMemo(() => {
    const resolved = [];
    for (const entry of entries) {
      const inventory = getToolsInventoryEntry(entry.toolId);
      if (!inventory) continue;
      resolved.push({
        key: `${entry.toolId}:${entry.fileName}`,
        toolId: entry.toolId,
        fileName: entry.fileName,
        toolTitle: resolveInventoryToolLabel(entry.toolId, tTools),
        href: resolveToolHref(entry.toolId, inventory.primaryCategory, locale),
        when: formatRelativeTime(entry.at, locale),
        Icon: getToolListLucideIcon(entry.toolId),
      });
      if (resolved.length >= MAX_ITEMS) break;
    }
    return resolved;
  }, [entries, locale, tTools]);

  if (!items.length) return null;

  return (
    <HomeReveal className="w-full">
      <section aria-labelledby="recent-workspaces-title" className="w-full mb-10">
        <h2
          id="recent-workspaces-title"
          className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <FileClock size={18} strokeWidth={1.75} aria-hidden className="text-neutral-400" />
          {t("landing.recentTitle")}
        </h2>

        <ul className="m-0 grid w-full list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {items.map(({ key, toolId, fileName, toolTitle, href, when, Icon }) => (
            <li key={key} className="m-0 min-w-0">
              <div
                style={homeToolAccentStyle(toolId)}
                className="home-accent-card flex h-full items-center gap-4 rounded-2xl p-4"
              >
                <span
                  aria-hidden
                  className="home-accent-card__icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                >
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className="home-accent-card__title truncate text-sm font-semibold"
                    title={fileName}
                  >
                    {fileName}
                  </span>
                  <span className="home-accent-card__desc truncate text-xs">
                    {toolTitle} · {when}
                  </span>
                </span>
                <Link
                  href={href}
                  prefetch={false}
                  className="home-accent-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  aria-label={`${t("landing.recentResume")} — ${toolTitle}`}
                >
                  <Play size={12} strokeWidth={2} aria-hidden />
                  {t("landing.recentResume")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </HomeReveal>
  );
}
