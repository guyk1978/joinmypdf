"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileClock, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
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
        {items.map(({ key, fileName, toolTitle, href, when, Icon }) => (
          <li key={key} className="m-0 min-w-0">
            <div className="flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/80"
              >
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className="truncate text-sm font-semibold text-white"
                  title={fileName}
                >
                  {fileName}
                </span>
                <span className="truncate text-xs text-neutral-400">
                  {toolTitle} · {when}
                </span>
              </span>
              <Link
                href={href}
                prefetch={false}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.1] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
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
